import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CalendarCheck,
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Save,
  Check,
  X,
  FileSpreadsheet,
  Filter,
  Download,
  Printer,
  Search,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import { apiService } from '../services/api';

const COURSES = [
  { code: 'CSE', name: 'Computer Science (CSE)' },
  { code: 'IT', name: 'Information Technology (IT)' },
  { code: 'AI&DS', name: 'AI & Data Science (AI&DS)' },
  { code: 'ECE', name: 'Electronics & Communication (ECE)' },
  { code: 'MECH', name: 'Mechanical Engineering (MECH)' },
  { code: 'CIVIL', name: 'Civil Engineering (CIVIL)' },
];
const DEPARTMENTS = COURSES.map((c) => c.code);
const SUBJECTS = ['DBMS', 'DSA', 'Python', 'Web Technologies', 'Computer Networks'];

export default function Attendance({
  showToast,
  defaultDepartment,
  userRole = 'admin',
  currentUser,
  allowedSubjects,
}) {
  const [activeTab, setActiveTab] = useState('mark'); // 'mark' | 'summary'

  const isStudent = userRole === 'student';
  const isTeacher = userRole === 'teacher';
  const teacherDept = currentUser?.department || defaultDepartment || 'IT';

  const studentRollNo =
    currentUser?.associated_id ||
    currentUser?.roll_no ||
    currentUser?.student_profile?.roll_no ||
    'CSE2024001';
  const studentName =
    currentUser?.name || currentUser?.student_profile?.name || 'Student';
  const studentDept =
    currentUser?.department || currentUser?.student_profile?.department || 'CSE';
  const studentSem =
    currentUser?.semester || currentUser?.student_profile?.semester || 4;

  // Student Attendance State
  const [studentAttendance, setStudentAttendance] = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [studentSubFilter, setStudentSubFilter] = useState('ALL');
  const [studentStatusFilter, setStudentStatusFilter] = useState('ALL');
  const [studentSearchDate, setStudentSearchDate] = useState('');

  const loadStudentAttendance = useCallback(async () => {
    setLoadingStudent(true);
    try {
      const res = await apiService.getStudentAttendance(studentRollNo);
      setStudentAttendance(res);
    } catch (err) {
      showToast(err.message || 'Failed to load personal attendance records', 'error');
    } finally {
      setLoadingStudent(false);
    }
  }, [studentRollNo, showToast]);

  useEffect(() => {
    if (isStudent) {
      loadStudentAttendance();
    }
  }, [isStudent, loadStudentAttendance]);

  // Dynamically resolve assigned subjects and classes for teacher
  const teacherAssignedSubjects =
    allowedSubjects ||
    currentUser?.assigned_subjects ||
    currentUser?.teacher_profile?.assigned_subjects ||
    (isTeacher ? ['DBMS', 'Python'] : null);

  const teacherAssignedClasses = useMemo(() => {
    const list =
      currentUser?.assigned_classes ||
      currentUser?.teacher_profile?.assigned_classes ||
      ['AI&DS-Sem4', 'CSE-Sem4', 'IT-Sem4'];
    return Array.isArray(list) ? list : ['AI&DS-Sem4', 'CSE-Sem4', 'IT-Sem4'];
  }, [
    currentUser?.assigned_classes ? currentUser.assigned_classes.join(',') : '',
    currentUser?.teacher_profile?.assigned_classes ? currentUser.teacher_profile.assigned_classes.join(',') : '',
  ]);

  const teacherAssignedClassesKey = useMemo(() => {
    return teacherAssignedClasses.join(',') || 'AI&DS-Sem4,CSE-Sem4,IT-Sem4';
  }, [teacherAssignedClasses]);

  const teacherAllowedDepts = useMemo(() => {
    if (!isTeacher) return COURSES.map((c) => c.code);
    const depts = new Set();
    if (teacherDept) depts.add(teacherDept);
    teacherAssignedClasses.forEach((c) => {
      if (c && c.includes('-')) {
        depts.add(c.split('-')[0].trim().toUpperCase());
      } else if (c) {
        depts.add(c.trim().toUpperCase());
      }
    });
    // Ensure authorized teaching departments are accessible
    depts.add('AI&DS');
    depts.add('CSE');
    depts.add('IT');
    return Array.from(depts);
  }, [isTeacher, teacherDept, teacherAssignedClassesKey]);

  const availableSubjects =
    isTeacher && teacherAssignedSubjects && teacherAssignedSubjects.length > 0
      ? teacherAssignedSubjects
      : SUBJECTS;

  const initialSubject = isTeacher && availableSubjects.length > 0 ? availableSubjects[0] : 'DBMS';

  // Mark Attendance State
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    department: isTeacher ? (teacherAllowedDepts[0] || 'CSE') : (defaultDepartment || 'CSE'),
    semester: 4,
    subject: initialSubject,
  });

  useEffect(() => {
    if (availableSubjects.length > 0 && !availableSubjects.includes(filters.subject)) {
      setFilters((prev) => ({ ...prev, subject: availableSubjects[0] }));
    }
  }, [availableSubjects, filters.subject]);

  const [sessionRecords, setSessionRecords] = useState([]);
  const [loadingSession, setLoadingSession] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [isExistingSession, setIsExistingSession] = useState(false);

  // Summary State
  const [summaryData, setSummaryData] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryDept, setSummaryDept] = useState(isTeacher ? (teacherAllowedDepts[0] || 'IT') : '');

  // 1. Fetch Session Roster
  const loadSession = useCallback(async () => {
    setLoadingSession(true);
    try {
      const res = await apiService.getAttendance({
        date: filters.date,
        department: filters.department,
        semester: filters.semester,
        subject: filters.subject,
      });

      if (res && res.session) {
        setSessionRecords(res.session.records || []);
        setIsExistingSession(Boolean(res.exists));
      }
    } catch (err) {
      showToast(err.message || 'Failed to load attendance session', 'error');
    } finally {
      setLoadingSession(false);
    }
  }, [filters, showToast]);

  useEffect(() => {
    if (activeTab === 'mark') {
      loadSession();
    }
  }, [activeTab, loadSession]);

  // 2. Fetch Summary
  const loadSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const res = await apiService.getAttendanceSummary({
        department: summaryDept,
      });
      setSummaryData(res);
    } catch (err) {
      showToast(err.message || 'Failed to load attendance summary', 'error');
    } finally {
      setLoadingSummary(false);
    }
  }, [summaryDept, showToast]);

  useEffect(() => {
    if (activeTab === 'summary') {
      loadSummary();
    }
  }, [activeTab, loadSummary]);

  // Mark all present / absent
  const handleMarkAll = (status) => {
    setSessionRecords((prev) =>
      prev.map((r) => ({
        ...r,
        status: status,
      }))
    );
  };

  const handleStatusChange = (rollNo, status) => {
    setSessionRecords((prev) =>
      prev.map((r) => (r.roll_no === rollNo ? { ...r, status } : r))
    );
  };

  const handleRemarkChange = (rollNo, remark) => {
    setSessionRecords((prev) =>
      prev.map((r) => (r.roll_no === rollNo ? { ...r, remark } : r))
    );
  };

  const handleSaveAttendance = async () => {
    if (sessionRecords.length === 0) {
      showToast('No student records to save.', 'warning');
      return;
    }
    setSavingSession(true);
    try {
      await apiService.recordAttendance({
        date: filters.date,
        department: filters.department,
        semester: Number(filters.semester),
        subject: filters.subject,
        records: sessionRecords,
      });
      setIsExistingSession(true);
      showToast('Attendance recorded successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to save attendance', 'error');
    } finally {
      setSavingSession(false);
    }
  };

  // Handle Student CSV Download
  const handleDownloadStudentCSV = () => {
    if (!studentAttendance) {
      showToast('No attendance records available to export.', 'warning');
      return;
    }
    const history = studentAttendance.history || [];
    const subjects = studentAttendance.subjects_breakdown || [];

    const headers = ['Date', 'Day', 'Time Slot', 'Subject', 'Teacher', 'Status', 'Topic / Remarks'];
    const rows = history.map((h) => [
      `"${h.date}"`,
      `"${h.day}"`,
      `"${h.time_slot}"`,
      `"${h.subject}"`,
      `"${h.teacher}"`,
      `"${h.status}"`,
      `"${(h.remark || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [
      `OFFICIAL STUDENT ATTENDANCE REPORT`,
      `Student Name,"${studentAttendance.name || studentName}"`,
      `Roll Number,"${studentAttendance.roll_no || studentRollNo}"`,
      `Department,"${studentAttendance.department || studentDept}"`,
      `Semester,"Semester ${studentAttendance.semester || studentSem}"`,
      `Report Generated,"${new Date().toISOString().split('T')[0]}"`,
      ``,
      `OVERALL ATTENDANCE SUMMARY`,
      `Overall Percentage,"${studentAttendance.attendance_percentage}%"`,
      `Total Sessions,"${studentAttendance.total_sessions}"`,
      `Sessions Attended,"${studentAttendance.attended_sessions}"`,
      `Sessions Absent,"${studentAttendance.absent_sessions}"`,
      `Late Arrivals,"${studentAttendance.late_sessions}"`,
      `Eligibility Status,"${studentAttendance.is_low ? 'Shortage (<75%)' : 'Eligible for Examinations'}"`,
      ``,
      `SUBJECT-WISE BREAKDOWN`,
      `Subject,Faculty,Total Sessions,Attended,Absent,Percentage,Status`,
      ...subjects.map(
        (s) =>
          `"${s.subject}","${s.teacher}",${s.total_sessions},${s.attended_sessions},${s.absent_sessions},"${s.attendance_percentage}%","${s.status}"`
      ),
      ``,
      `DATE-WISE SESSION LOGS`,
      headers.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Attendance_Report_${studentAttendance.roll_no || studentRollNo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Personal attendance records downloaded as CSV!', 'success');
  };

  const handlePrintStudentReport = () => {
    window.print();
  };

  if (isStudent) {
    if (loadingStudent) {
      return (
        <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading your personal attendance records...</span>
        </div>
      );
    }

    const filteredHistory = (studentAttendance?.history || []).filter((h) => {
      if (studentSubFilter !== 'ALL' && h.subject !== studentSubFilter) return false;
      if (studentStatusFilter !== 'ALL' && h.status !== studentStatusFilter) return false;
      if (studentSearchDate.trim()) {
        const q = studentSearchDate.toLowerCase().trim();
        const match =
          (h.date && h.date.toLowerCase().includes(q)) ||
          (h.day && h.day.toLowerCase().includes(q)) ||
          (h.subject && h.subject.toLowerCase().includes(q)) ||
          (h.teacher && h.teacher.toLowerCase().includes(q)) ||
          (h.remark && h.remark.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });

    const attPct = studentAttendance?.attendance_percentage ?? 88.5;
    const isShortage = studentAttendance?.is_low ?? (attPct < 75.0);

    return (
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-7 h-7 text-indigo-600" />
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                My Attendance Record
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-200">
                Verified Student Portal
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Personal date-wise attendance logs, overall attendance rate, subject breakdown, and examination eligibility.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrintStudentReport}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Download / Print PDF</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadStudentCSV}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Shortage Warning or Good Standing Banner */}
        {isShortage ? (
          <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-rose-800 text-xs flex items-center gap-3 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <strong className="font-bold">Attendance Shortage Warning ({attPct}%):</strong> Your current overall attendance is below the mandatory 75% institutional threshold. You risk being debarred from end-semester examinations. Please contact your department coordinator immediately.
            </div>
          </div>
        ) : (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs flex items-center gap-3 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <strong className="font-bold">Good Standing ({attPct}%):</strong> You have satisfied the institutional attendance requirement (≥75%) and are eligible to sit for all end-semester subject examinations.
            </div>
          </div>
        )}

        {/* Student Profile & Overall Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 block mb-1">Overall Attendance Rate</span>
            <div className={`text-3xl font-black font-mono ${isShortage ? 'text-rose-600' : 'text-emerald-600'}`}>
              {attPct}%
            </div>
            <span className={`text-[11px] font-semibold mt-1 block ${isShortage ? 'text-rose-500' : 'text-emerald-600'}`}>
              {isShortage ? 'Shortage (<75%)' : 'Eligible for Exams'}
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 block mb-1">Total Classes Held</span>
            <div className="text-3xl font-black font-mono text-slate-900">
              {studentAttendance?.total_sessions || 0}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Across all enrolled courses
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 block mb-1">Classes Attended</span>
            <div className="text-3xl font-black font-mono text-indigo-600">
              {studentAttendance?.attended_sessions || 0}
            </div>
            <span className="text-[11px] text-indigo-500 mt-1 block">
              Present & Late sessions
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 block mb-1">Classes Missed</span>
            <div className="text-3xl font-black font-mono text-rose-500">
              {studentAttendance?.absent_sessions || 0}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {studentAttendance?.late_sessions ? `${studentAttendance.late_sessions} Late arrivals` : '0 Late arrivals'}
            </span>
          </div>
        </div>

        {/* Subject-Wise Attendance Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Subject-Wise Attendance Breakdown
              </h2>
              <p className="text-xs text-slate-500">
                Subject level lecture attendance, instructor allocation, and eligibility status.
              </p>
            </div>
            <span className="text-xs text-slate-500">
              Mandatory minimum threshold: <strong className="text-slate-800">75%</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(studentAttendance?.subjects_breakdown || []).map((sub, idx) => {
              const subPct = sub.attendance_percentage;
              const isSubLow = sub.is_low;
              return (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{sub.subject}</h3>
                      <p className="text-[11px] text-slate-500">{sub.teacher || 'Faculty'}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isSubLow ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
                      {subPct}%
                    </span>
                  </div>

                  {/* Progress Bar with 75% Marker */}
                  <div className="space-y-1">
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all ${isSubLow ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(subPct, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Attended: {sub.attended_sessions} / {sub.total_sessions}</span>
                      <span className={isSubLow ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                        {isSubLow ? 'Warning (<75%)' : 'Eligible'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Date-Wise Personal Session Logs */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Date-Wise Attendance History Logs ({filteredHistory.length} Sessions)
              </h2>
              <p className="text-xs text-slate-500">
                Detailed timeline of every lecture session recorded by your course faculty.
              </p>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search date or topic..."
                  value={studentSearchDate}
                  onChange={(e) => setStudentSearchDate(e.target.value)}
                  className="bg-transparent focus:outline-none text-xs w-36 text-slate-800"
                />
              </div>

              <select
                value={studentSubFilter}
                onChange={(e) => setStudentSubFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Subjects</option>
                {(studentAttendance?.enrolled_subjects || []).map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>

              <select
                value={studentStatusFilter}
                onChange={(e) => setStudentStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="Present">Present Only</option>
                <option value="Late">Late Only</option>
                <option value="Absent">Absent Only</option>
              </select>

              {(studentSubFilter !== 'ALL' || studentStatusFilter !== 'ALL' || studentSearchDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setStudentSubFilter('ALL');
                    setStudentStatusFilter('ALL');
                    setStudentSearchDate('');
                  }}
                  className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-700 font-bold transition"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No attendance session records match your filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase">
                    <th className="py-3 px-4 border-r border-slate-200">Date & Day</th>
                    <th className="py-3 px-4 border-r border-slate-200">Time Slot</th>
                    <th className="py-3 px-4 border-r border-slate-200">Subject</th>
                    <th className="py-3 px-4 border-r border-slate-200">Faculty</th>
                    <th className="py-3 px-4 border-r border-slate-200 text-center">Status</th>
                    <th className="py-3 px-4">Lecture Topic / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map((h, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 border-r border-slate-100 whitespace-nowrap">
                        {h.date} <span className="text-slate-400 font-normal">({h.day})</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 border-r border-slate-100 whitespace-nowrap">
                        {h.time_slot || '09:00 - 10:00'}
                      </td>
                      <td className="py-3 px-4 font-bold text-indigo-700 border-r border-slate-100">
                        {h.subject}
                      </td>
                      <td className="py-3 px-4 text-slate-700 border-r border-slate-100">
                        {h.teacher || 'Faculty'}
                      </td>
                      <td className="py-3 px-4 text-center border-r border-slate-100">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            h.status === 'Present'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : h.status === 'Late'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {h.status === 'Present' && <Check className="w-3 h-3" />}
                          {h.status === 'Late' && <Clock className="w-3 h-3" />}
                          {h.status === 'Absent' && <X className="w-3 h-3" />}
                          {h.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {h.remark || 'Regular lecture class session'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-7 h-7 text-indigo-600" />
            Attendance Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track daily class attendance, calculate shortage warnings (&lt;75%), and view aggregate summaries.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('mark')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'mark'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daily Session Marking
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'summary'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Attendance Summaries & Warnings
          </button>
        </div>
      </div>

      {/* TAB 1: MARK ATTENDANCE */}
      {activeTab === 'mark' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Session Date
                </label>
                <input
                  type="date"
                  value={filters.date}
                  onChange={(e) =>
                    setFilters({ ...filters, date: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Course / Department
                  </label>
                  {isTeacher && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                      Assigned
                    </span>
                  )}
                </div>
                {isTeacher ? (
                  <select
                    value={filters.department}
                    onChange={(e) =>
                      setFilters({ ...filters, department: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
                  >
                    {teacherAllowedDepts.map((dCode) => {
                      const isHome = dCode === teacherDept;
                      const courseName = COURSES.find((c) => c.code === dCode)?.name || dCode;
                      return (
                        <option key={dCode} value={dCode}>
                          {dCode} — {courseName} {isHome ? '(Home Dept)' : '(Teaching: Sem 4)'}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <select
                    value={filters.department}
                    onChange={(e) =>
                      setFilters({ ...filters, department: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    {COURSES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Semester
                </label>
                <select
                  value={filters.semester}
                  onChange={(e) =>
                    setFilters({ ...filters, semester: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Subject / Course
                  </label>
                  {isTeacher && (
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded">
                      Assigned ({availableSubjects.length})
                    </span>
                  )}
                </div>
                <select
                  value={filters.subject}
                  onChange={(e) =>
                    setFilters({ ...filters, subject: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {availableSubjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub} {isTeacher ? '• (Assigned)' : ''}
                    </option>
                  ))}
                </select>
                {isTeacher && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Marking attendance is restricted to your assigned subjects.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">
                  {isExistingSession ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                      <Check className="w-3 h-3" /> Existing Session Recorded
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                      New Session (Draft)
                    </span>
                  )}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500">
                  {sessionRecords.length} Students in Roster
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMarkAll('Present')}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition"
                >
                  All Present
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll('Absent')}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200 transition"
                >
                  All Absent
                </button>
                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  disabled={savingSession}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-200 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingSession ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Save Attendance</span>
                </button>
              </div>
            </div>
          </div>

          {/* Roster Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loadingSession ? (
              <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span>Loading class roster...</span>
              </div>
            ) : sessionRecords.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No students enrolled in {filters.department} Semester {filters.semester}.
                Please adjust filters or enroll students.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Roll Number</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sessionRecords.map((rec, idx) => (
                      <tr
                        key={rec.roll_no}
                        className="hover:bg-slate-50/70 transition"
                      >
                        <td className="py-3 px-4 text-slate-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {rec.roll_no}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {rec.name}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {['Present', 'Absent', 'Late', 'Excused'].map((st) => {
                              const isSelected = rec.status === st;
                              let activeClass = 'bg-slate-100 text-slate-600 border-slate-200';
                              if (isSelected) {
                                if (st === 'Present')
                                  activeClass = 'bg-emerald-600 text-white border-emerald-600 shadow-sm';
                                else if (st === 'Absent')
                                  activeClass = 'bg-rose-600 text-white border-rose-600 shadow-sm';
                                else if (st === 'Late')
                                  activeClass = 'bg-amber-500 text-white border-amber-500 shadow-sm';
                                else if (st === 'Excused')
                                  activeClass = 'bg-blue-600 text-white border-blue-600 shadow-sm';
                              }
                              return (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() =>
                                    handleStatusChange(rec.roll_no, st)
                                  }
                                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition ${activeClass}`}
                                >
                                  {st}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            placeholder="Optional note"
                            value={rec.remark || ''}
                            onChange={(e) =>
                              handleRemarkChange(rec.roll_no, e.target.value)
                            }
                            className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE SUMMARIES & WARNINGS */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                Department Filter:
              </span>
              {isTeacher ? (
                <select
                  value={summaryDept}
                  onChange={(e) => setSummaryDept(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
                >
                  {teacherAllowedDepts.map((d) => (
                    <option key={d} value={d}>
                      {d} {d === teacherDept ? '(Home Dept)' : '(Teaching: Sem 4)'}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={summaryDept}
                  onChange={(e) => setSummaryDept(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Departments</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {summaryData && (
              <div className="flex items-center gap-4 text-xs">
                <span className="text-slate-500">
                  Overall Rate:{' '}
                  <strong className="text-slate-900 font-mono">
                    {summaryData.overall_attendance_percentage}%
                  </strong>
                </span>
                <span className="text-rose-600 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {summaryData.low_attendance_count} Low Attendance Shortages (&lt;75%)
                </span>
              </div>
            )}
          </div>

          {/* Summary Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loadingSummary ? (
              <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span>Computing real-time attendance statistics...</span>
              </div>
            ) : !summaryData || summaryData.records.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No attendance records found for this criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Roll Number</th>
                      <th className="py-3 px-4">Full Name</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Semester</th>
                      <th className="py-3 px-4 text-center">Sessions Held</th>
                      <th className="py-3 px-4 text-center">Sessions Attended</th>
                      <th className="py-3 px-4 text-center">Attendance %</th>
                      <th className="py-3 px-4 text-center">Eligibility Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summaryData.records.map((r) => {
                      const isLow = r.is_low_attendance;
                      return (
                        <tr
                          key={r.roll_no}
                          className={`hover:bg-slate-50/70 transition ${
                            isLow ? 'bg-rose-50/30' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {r.roll_no}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {r.name}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {r.department}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            Sem {r.semester}
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-slate-600">
                            {r.total_sessions}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                            {r.attended_sessions}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold">
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${
                                isLow
                                  ? 'bg-rose-100 text-rose-700 font-black'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {r.attendance_percentage}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isLow ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-bold border border-rose-200">
                                <AlertTriangle className="w-3 h-3" />
                                Shortage (&lt;75%)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                Eligible
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
