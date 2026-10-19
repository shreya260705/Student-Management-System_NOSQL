import React from 'react';
import { RefreshCw, UserPlus, Database, AlertCircle } from 'lucide-react';

export default function Navbar({
  activeTab,
  dbStatus,
  onRefresh,
  isRefreshing,
  onOpenAddStudent
}) {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'Academic Dashboard', subtitle: 'Overview of student demographics, metrics, and grade distribution' };
      case 'students':
        return { title: 'Student Management Directory', subtitle: 'Search, filter, view details, update, or remove student records' };
      case 'analytics':
        return { title: 'MongoDB Aggregation Analytics', subtitle: 'Real-time multi-stage aggregation pipeline results (CSE494)' };
      default:
        return { title: 'Student Management System', subtitle: 'Intelligent NoSQL Databases' };
    }
  };

  const { title, subtitle } = getTabTitle();

  return (
    <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-sm">
      {/* Title & Subtitle */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>

      {/* Actions & Status */}
      <div className="flex items-center gap-4">
        {/* MongoDB Connection Status Pill */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
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
              <span>MongoDB Online ({dbStatus.database || 'student_management'})</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>MongoDB Disconnected</span>
            </>
          )}
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-50"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
        </button>

        {/* Add Student Primary Button */}
        <button
          onClick={onOpenAddStudent}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-all shadow-indigo-600/20 active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Student</span>
        </button>
      </div>
    </header>
  );
}
