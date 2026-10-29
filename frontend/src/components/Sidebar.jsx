import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  BarChart3,
  Database,
  GraduationCap,
  CalendarCheck,
  Award,
  Calendar,
  CreditCard,
  Bell,
  FileText,
  BookOpen,
  LogOut,
  Shield,
  Briefcase,
  Layers,
  Home,
  KeyRound,
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  userRole = 'admin',
  currentUser,
  onLogout,
  onSwitchRole,
  onViewLanding,
}) {
  // Navigation lists tailored to role
  const adminNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'teachers', label: 'Teachers / Faculty', icon: GraduationCap },
    { id: 'academic', label: 'Courses & Allocations', icon: BookOpen },
    { id: 'exams', label: 'Exams & Results', icon: Award },
    { id: 'timetable', label: 'Timetable', icon: Calendar },
    { id: 'fees', label: 'Fees & Accounts', icon: CreditCard },
    { id: 'announcements', label: 'Announcements', icon: Bell },
    { id: 'analytics', label: 'NoSQL Analytics', icon: BarChart3 },
    { id: 'reports', label: 'Reports & Audit', icon: FileText },
  ];

  const teacherNav = [
    { id: 'teacher_portal', label: 'Teacher Dashboard', icon: LayoutDashboard },
    { id: 'attendance', label: 'Mark Attendance', icon: CalendarCheck },
    { id: 'exams', label: 'Enter Subject Marks', icon: Award },
    { id: 'timetable', label: 'Class Timetable', icon: Calendar },
    { id: 'announcements', label: 'Class Notices', icon: Bell },
  ];

  const studentNav = [
    { id: 'student_portal', label: 'Student Dashboard', icon: LayoutDashboard },
    { id: 'exams', label: 'Academic Transcript', icon: Award },
    { id: 'attendance', label: 'My Attendance', icon: CalendarCheck },
    { id: 'timetable', label: 'Weekly Schedule', icon: Calendar },
    { id: 'fees', label: 'Fee Clearance', icon: CreditCard },
    { id: 'announcements', label: 'Campus Notices', icon: Bell },
  ];

  let navItems = adminNav;
  if (userRole === 'teacher') navItems = teacherNav;
  if (userRole === 'student') navItems = studentNav;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none h-screen sticky top-0 overflow-y-auto">
      {/* Brand & Logo */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-white text-base leading-tight tracking-tight">
              EduManage
            </h1>
            <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">
              NoSQL Academic v2.0
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1">
        <div className="px-3 pb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
          {userRole.toUpperCase()} PORTAL
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Public Landing Link */}
        <div className="pt-4 px-3 pb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
          Site Navigation
        </div>
        <button
          type="button"
          onClick={onViewLanding}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer"
        >
          <Home className="w-4 h-4 shrink-0 text-slate-500" />
          <span>Public Landing Page</span>
        </button>
      </div>

      {/* Switch Role / Account (Opens Authentication Modal) */}
      <div className="p-3 mx-3 my-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Switch Account</span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
        </div>
        <button
          type="button"
          onClick={() => onSwitchRole()}
          className="w-full py-1.5 px-3 bg-indigo-600/90 hover:bg-indigo-600 text-white font-semibold text-xs rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Switch Role / Sign In</span>
        </button>
      </div>

      {/* User Session Footer & Logout */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
              {currentUser?.name?.slice(0, 2).toUpperCase() || 'US'}
            </div>
            <div className="overflow-hidden">
              <div className="font-bold text-white text-xs truncate">
                {currentUser?.name || 'User'}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {currentUser?.email || ''}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
