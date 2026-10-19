import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  BarChart3,
  Database,
  GraduationCap
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onOpenAddStudent }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand & Logo */}
      <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base leading-tight">EduNoSQL</h1>
          <p className="text-xs text-indigo-400 font-medium">Student Management</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 px-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
          Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
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

        <div className="pt-5 px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
          Quick Action
        </div>
        <button
          onClick={onOpenAddStudent}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 border border-emerald-800/40 transition-all"
        >
          <UserPlus className="w-4 h-4 shrink-0" />
          <span>Add New Student</span>
        </button>
      </div>

      {/* Database & Academic Info Card */}
      <div className="p-4 m-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-400">
        <div className="flex items-center gap-2 mb-1.5 text-slate-200 font-semibold">
          <Database className="w-3.5 h-3.5 text-indigo-400" />
          <span>CSE494 Project</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          Intelligent NoSQL Databases. Powered by MongoDB & PyMongo Aggregations.
        </p>
      </div>
    </aside>
  );
}
