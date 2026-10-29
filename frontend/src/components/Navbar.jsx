import React from 'react';
import {
  RefreshCw,
  UserPlus,
  Database,
  AlertCircle,
  Home,
  Shield,
  Briefcase,
  GraduationCap,
} from 'lucide-react';

export default function Navbar({
  activeTab,
  dbStatus,
  onRefresh,
  isRefreshing,
  onOpenAddStudent,
  userRole = 'admin',
  currentUser,
  onViewLanding,
}) {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Institutional Administration Dashboard',
          subtitle: 'Holistic overview of student enrollment, departmental standing, and KPI metrics',
        };
      case 'students':
        return {
          title: 'Student Directory & Records',
          subtitle: 'Search, filter, edit, archive, CSV import/export, and schema validation',
        };
      case 'teachers':
        return {
          title: 'Faculty & Instructor Directory',
          subtitle: 'Teaching staff assignments, subject allocations, and departmental records',
        };
      case 'academic':
        return {
          title: 'Academic Courses & Curriculum',
          subtitle: 'Degree programs, classroom sections, and syllabus specifications',
        };
      case 'attendance':
        return {
          title: 'Attendance Management & Audit',
          subtitle: 'Record daily session registers and compute shortage warnings (<75%)',
        };
      case 'exams':
        return {
          title: 'Examinations, Marks & Report Cards',
          subtitle: 'Assessment definitions, batch marks entry with 0-100 validation, and printable transcripts',
        };
      case 'timetable':
        return {
          title: 'Class Timetables & Schedules',
          subtitle: 'Weekly lecture timings, room allocations, and instructor schedules',
        };
      case 'fees':
        return {
          title: 'Tuition Fees & Financial Ledgers',
          subtitle: 'Student fee status, installment recording, and payment vouchers',
        };
      case 'announcements':
        return {
          title: 'Campus Notice Board & Circulars',
          subtitle: 'Broadcast official academic alerts, examination circulars, and notifications',
        };
      case 'analytics':
        return {
          title: 'MongoDB Aggregation Analytics (CSE494)',
          subtitle: 'Real-time multi-stage aggregation pipeline results executed via PyMongo',
        };
      case 'reports':
        return {
          title: 'Official Reports & Audit Extracts',
          subtitle: 'Academic transcripts, merit rank lists, and regulatory attendance files',
        };
      case 'teacher_portal':
        return {
          title: 'Faculty Classroom Portal',
          subtitle: 'Assigned classroom management, attendance logs, and subject grade submissions',
        };
      case 'student_portal':
        return {
          title: 'Student Academic Portal',
          subtitle: 'Personal academic progress, examination transcripts, and attendance standing',
        };
      default:
        return {
          title: 'EduManage Student Management System',
          subtitle: 'Intelligent NoSQL Academic Administration',
        };
    }
  };

  const { title, subtitle } = getTabTitle();

  const getRoleBadge = () => {
    if (userRole === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
          <Shield className="w-3 h-3 text-indigo-600" />
          Admin
        </span>
      );
    }
    if (userRole === 'teacher') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
          <Briefcase className="w-3 h-3 text-emerald-600" />
          Faculty
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
        <GraduationCap className="w-3 h-3 text-blue-600" />
        Student
      </span>
    );
  };

  return (
    <header className="h-20 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between shrink-0 shadow-xs z-10">
      {/* Title & Subtitle */}
      <div className="overflow-hidden pr-4">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight truncate">
          {title}
        </h2>
        <p className="text-xs text-slate-500 truncate hidden sm:block">
          {subtitle}
        </p>
      </div>

      {/* Actions & Status */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Role Badge */}
        {getRoleBadge()}

        {/* MongoDB Connection Status Pill */}
        <div
          className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
            dbStatus.connected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
          title={dbStatus.message || 'MongoDB status'}
        >
          {dbStatus.connected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>MongoDB Online</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>MongoDB Disconnected</span>
            </>
          )}
        </div>

        {/* Public Landing Shortcut */}
        <button
          type="button"
          onClick={onViewLanding}
          className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
          title="View Public Landing Page"
        >
          <Home className="w-4 h-4" />
        </button>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition disabled:opacity-50 cursor-pointer"
          title="Refresh Current Data"
        >
          <RefreshCw
            className={`w-4 h-4 ${
              isRefreshing ? 'animate-spin text-indigo-600' : ''
            }`}
          />
        </button>

        {/* Add Student Primary Button (Visible on Admin Role) */}
        {userRole === 'admin' && (
          <button
            onClick={onOpenAddStudent}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Student</span>
          </button>
        )}
      </div>
    </header>
  );
}
