import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import StudentDetailsModal from './components/StudentDetailsModal';
import StudentFormModal from './components/StudentFormModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';

import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Analytics from './pages/Analytics';

import { apiService } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

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

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

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
  }, []);

  // 3. Fetch Students List
  const loadStudents = useCallback(async (currentFilters = filters) => {
    setLoadingStudents(true);
    try {
      const data = await apiService.getStudents(currentFilters);
      setStudents(data.students || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 10, total_pages: 1 });
    } catch (err) {
      showToast(err.message || 'Failed to fetch student records', 'error');
    } finally {
      setLoadingStudents(false);
    }
  }, [filters]);

  // Initial load
  useEffect(() => {
    checkHealth();
    loadDashboardStats();
    loadStudents();
  }, [checkHealth, loadDashboardStats, loadStudents]);

  // Global Refresh Handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await checkHealth();
    await Promise.all([loadDashboardStats(), loadStudents(filters)]);
    setIsRefreshing(false);
    showToast('Data refreshed successfully from MongoDB', 'success');
  };

  // Filter change handler
  const handleFilterChange = (newFilters) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    loadStudents(updated);
  };

  // Reset filters handler
  const handleResetFilters = () => {
    const defaultFilters = {
      page: 1,
      limit: 10,
      search: '',
      department: '',
      semester: '',
      sort_by: 'created_at',
      sort_order: 'desc',
    };
    setFilters(defaultFilters);
    loadStudents(defaultFilters);
  };

  // Page change handler
  const handlePageChange = (newPage) => {
    handleFilterChange({ page: newPage });
  };

  // Create or Update Student
  const handleFormSubmit = async (payload, studentId = null) => {
    setIsSubmitting(true);
    try {
      if (studentId) {
        // Update student
        const res = await apiService.updateStudent(studentId, payload);
        showToast(res.message || 'Student updated successfully!', 'success');
      } else {
        // Create student
        const res = await apiService.createStudent(payload);
        showToast(res.message || 'Student enrolled successfully!', 'success');
      }

      setIsFormModalOpen(false);
      setStudentToEdit(null);

      // Refresh both list and dashboard
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

      // Refresh both list and dashboard
      await Promise.all([loadStudents(filters), loadDashboardStats()]);
    } catch (err) {
      showToast(err.message || 'Failed to delete student', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddStudent={() => {
          setStudentToEdit(null);
          setIsFormModalOpen(true);
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          activeTab={activeTab}
          dbStatus={dbStatus}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          onOpenAddStudent={() => {
            setStudentToEdit(null);
            setIsFormModalOpen(true);
          }}
        />

        {/* Scrollable Main Views */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <Dashboard
                stats={stats}
                loading={loadingStats}
                onViewStudent={(student) => setStudentForDetails(student)}
                onNavigateToStudents={() => setActiveTab('students')}
              />
            )}

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
              />
            )}

            {activeTab === 'analytics' && (
              <Analytics onError={(msg) => showToast(msg, 'error')} />
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

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
}
