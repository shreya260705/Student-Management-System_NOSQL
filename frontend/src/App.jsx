import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import StudentDetailsModal from './components/StudentDetailsModal';
import StudentFormModal from './components/StudentFormModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import AuthModal from './components/AuthModal';
import CsvImportModal from './components/CsvImportModal';

import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Academic from './pages/Academic';
import Attendance from './pages/Attendance';
import Exams from './pages/Exams';
import Timetable from './pages/Timetable';
import Fees from './pages/Fees';
import Announcements from './pages/Announcements';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import TeacherPortal from './pages/TeacherPortal';
import StudentPortal from './pages/StudentPortal';

import {
  apiService,
  getStoredUser,
  setStoredUser,
  setStoredToken,
  getStoredToken,
} from './services/api';

export default function App() {
  // Authentication & View State
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [isLandingView, setIsLandingView] = useState(() => !getStoredUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState(() => {
    const user = getStoredUser();
    if (user?.role === 'teacher') return 'teacher_portal';
    if (user?.role === 'student') return 'student_portal';
    return 'dashboard';
  });

  // Health and connection state
  const [dbStatus, setDbStatus] = useState({
    connected: false,
    database: '',
    message: 'Checking MongoDB connection...',
  });

  // Toast notifications
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Dashboard Stats
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Students Table & Pagination
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  });

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    department: '',
    semester: '',
    status: '',
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  const [loadingStudents, setLoadingStudents] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [studentForDetails, setStudentForDetails] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // 1. Fetch Health
  const checkHealth = useCallback(async () => {
    try {
      const data = await apiService.getHealth();
      setDbStatus({
        connected: data.status === 'healthy',
        database: data.database || 'student_management',
        message: data.status === 'healthy' ? 'MongoDB connected' : data.error,
      });
    } catch (err) {
      setDbStatus({
        connected: false,
        database: '',
        message: err.message || 'Cannot reach Flask backend server',
      });
    }
  }, []);

  // 2. Fetch Dashboard Statistics
  const loadDashboardStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const data = await apiService.getDashboardStats();
      setStats(data);
    } catch (err) {
      showToast(err.message || 'Failed to load dashboard statistics', 'error');
    } finally {
      setLoadingStats(false);
    }
  }, [showToast]);

  // 3. Fetch Students List
  const loadStudents = useCallback(
    async (currentFilters = filters) => {
      setLoadingStudents(true);
      try {
        const data = await apiService.getStudents(currentFilters);
        setStudents(data.students || []);
        setPagination(
          data.pagination || { total: 0, page: 1, limit: 10, total_pages: 1 }
        );
      } catch (err) {
        showToast(err.message || 'Failed to fetch student records', 'error');
      } finally {
        setLoadingStudents(false);
      }
    },
    [filters, showToast]
  );

  // Initial load
  useEffect(() => {
    checkHealth();
    loadDashboardStats();
    loadStudents();

    if (getStoredToken()) {
      apiService
        .getMe()
        .then((res) => {
          if (res?.user) {
            setCurrentUser(res.user);
            setStoredUser(res.user);
          }
        })
        .catch(() => {});
    }
  }, [checkHealth, loadDashboardStats, loadStudents]);

  // Refresh Handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await checkHealth();
    await Promise.all([loadDashboardStats(), loadStudents(filters)]);
    setIsRefreshing(false);
    showToast('Data refreshed successfully from MongoDB', 'success');
  };

  // Filter handlers
  const handleFilterChange = (newFilters) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    loadStudents(updated);
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      page: 1,
      limit: 10,
      search: '',
      department: '',
      semester: '',
      status: '',
      sort_by: 'created_at',
      sort_order: 'desc',
    };
    setFilters(defaultFilters);
    loadStudents(defaultFilters);
  };

  const handlePageChange = (newPage) => {
    handleFilterChange({ page: newPage });
  };

  // Create / Update Student
  const handleFormSubmit = async (payload, studentId = null) => {
    setIsSubmitting(true);
    try {
      if (studentId) {
        const res = await apiService.updateStudent(studentId, payload);
        showToast(res.message || 'Student updated successfully!', 'success');
      } else {
        const res = await apiService.createStudent(payload);
        showToast(res.message || 'Student enrolled successfully!', 'success');
      }

      setIsFormModalOpen(false);
      setStudentToEdit(null);
      await Promise.all([loadStudents(filters), loadDashboardStats()]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Student
  const handleConfirmDelete = async (id) => {
    setIsDeleting(true);
    try {
      const res = await apiService.deleteStudent(id);
      showToast(res.message || 'Student deleted successfully', 'success');
      setStudentToDelete(null);
      await Promise.all([loadStudents(filters), loadDashboardStats()]);
    } catch (err) {
      showToast(err.message || 'Failed to delete student', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Archive Student
  const handleArchiveStudent = async (student) => {
    try {
      const res = await apiService.archiveStudent(student.id || student._id);
      showToast(res.message, 'success');
      loadStudents(filters);
    } catch (err) {
      showToast(err.message || 'Failed to archive student', 'error');
    }
  };

  // Auth Success Callback
  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setIsLandingView(false);
    showToast(`Welcome back, ${user.name}!`, 'success');
    if (user.role === 'teacher') {
      setActiveTab('teacher_portal');
    } else if (user.role === 'student') {
      setActiveTab('student_portal');
    } else {
      setActiveTab('dashboard');
    }
  };

  // Role Switcher - Opens authentication modal so user must sign in with actual credentials
  const handleSwitchRole = () => {
    setIsAuthModalOpen(true);
  };

  // Logout Handler
  const handleLogout = () => {
    setStoredUser(null);
    setStoredToken(null);
    setCurrentUser(null);
    setIsLandingView(true);
    showToast('You have been logged out.', 'info');
  };

  // Render Public Landing Page
  if (isLandingView) {
    return (
      <>
        <LandingPage
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onExploreDemo={() => setIsAuthModalOpen(true)}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />
      </>
    );
  }

  const userRole = currentUser?.role || 'admin';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={userRole}
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
        onViewLanding={() => setIsLandingView(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          activeTab={activeTab}
          dbStatus={dbStatus}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          userRole={userRole}
          currentUser={currentUser}
          onViewLanding={() => setIsLandingView(true)}
          onOpenAddStudent={() => {
            setStudentToEdit(null);
            setIsFormModalOpen(true);
          }}
        />

        {/* Scrollable Main Views */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Admin Dashboard */}
            {activeTab === 'dashboard' && (
              <Dashboard
                stats={stats}
                loading={loadingStats}
                onViewStudent={(student) => setStudentForDetails(student)}
                onNavigateToStudents={() => setActiveTab('students')}
              />
            )}

            {/* Students Directory */}
            {activeTab === 'students' && (
              <Students
                students={students}
                pagination={pagination}
                loading={loadingStudents}
                filters={filters}
                onFilterChange={handleFilterChange}
                onResetFilters={handleResetFilters}
                onPageChange={handlePageChange}
                onViewStudent={(student) => setStudentForDetails(student)}
                onEditStudent={(student) => {
                  setStudentToEdit(student);
                  setIsFormModalOpen(true);
                }}
                onDeleteStudent={(student) => setStudentToDelete(student)}
                onArchiveStudent={handleArchiveStudent}
                onOpenImportCsv={() => setIsCsvImportOpen(true)}
              />
            )}

            {/* Faculty & Teachers */}
            {activeTab === 'teachers' && (
              <Teachers showToast={showToast} />
            )}

            {/* Academic Courses & Classes */}
            {activeTab === 'academic' && (
              <Academic showToast={showToast} />
            )}

            {/* Attendance Management - Excluded from Admin Portal */}
            {activeTab === 'attendance' && userRole !== 'admin' && (
              <Attendance
                showToast={showToast}
                userRole={userRole}
                currentUser={currentUser}
                allowedSubjects={
                  currentUser?.assigned_subjects ||
                  currentUser?.teacher_profile?.assigned_subjects
                }
              />
            )}

            {/* Examinations & Report Cards */}
            {activeTab === 'exams' && (
              <Exams
                showToast={showToast}
                userRole={userRole}
                currentUser={currentUser}
              />
            )}

            {/* Class Timetable */}
            {activeTab === 'timetable' && (
              <Timetable
                showToast={showToast}
                userRole={userRole}
                currentUser={currentUser}
              />
            )}

            {/* Tuition Fees & Financials */}
            {activeTab === 'fees' && (
              <Fees
                showToast={showToast}
                userRole={userRole}
                currentUser={currentUser}
              />
            )}

            {/* Announcements Notice Board */}
            {activeTab === 'announcements' && (
              <Announcements showToast={showToast} userRole={userRole} />
            )}

            {/* The 5 MongoDB Aggregation Pipelines (CSE494) */}
            {activeTab === 'analytics' && (
              <Analytics onError={(msg) => showToast(msg, 'error')} />
            )}

            {/* Reports & Regulatory Audit */}
            {activeTab === 'reports' && (
              <Reports showToast={showToast} />
            )}

            {/* Dedicated Teacher Portal */}
            {activeTab === 'teacher_portal' && (
              <TeacherPortal
                currentUser={currentUser}
                showToast={showToast}
              />
            )}

            {/* Dedicated Student Portal */}
            {activeTab === 'student_portal' && (
              <StudentPortal
                currentUser={currentUser}
                showToast={showToast}
              />
            )}
          </div>
        </main>
      </div>

      {/* Modals & Dialogs */}
      <StudentFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setStudentToEdit(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={studentToEdit}
        isSubmitting={isSubmitting}
      />

      <StudentDetailsModal
        isOpen={Boolean(studentForDetails)}
        student={studentForDetails}
        onClose={() => setStudentForDetails(null)}
        onEdit={(student) => {
          setStudentToEdit(student);
          setIsFormModalOpen(true);
        }}
      />

      <DeleteConfirmModal
        isOpen={Boolean(studentToDelete)}
        student={studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      <CsvImportModal
        isOpen={isCsvImportOpen}
        onClose={() => setIsCsvImportOpen(false)}
        onImportSuccess={() => {
          loadStudents(filters);
          loadDashboardStats();
          showToast('CSV import completed successfully!', 'success');
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
}
