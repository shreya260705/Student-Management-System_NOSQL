import React from 'react';
import { X, Award, BookOpen, Calendar, Mail, Hash, Building2, Edit } from 'lucide-react';

export default function StudentDetailsModal({ student, isOpen, onClose, onEdit }) {
  if (!isOpen || !student) return null;

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'B': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'C': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'D': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-rose-100 text-rose-800 border-rose-300';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 60) return 'bg-amber-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-rose-500';
  };

  const formattedDate = student.created_at
    ? new Date(student.created_at).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'N/A';

  const marks = student.marks || { DBMS: 0, DSA: 0, Python: 0 };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden">
        {/* Header with Student Name & Grade */}
        <div className="p-6 bg-slate-900 text-white flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold">{student.name}</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getGradeColor(student.grade)}`}>
                Grade {student.grade}
              </span>
            </div>
            <p className="text-xs text-indigo-300 font-mono tracking-wide">{student.roll_no}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-slate-500 font-medium">Email Address</p>
                <p className="font-semibold text-slate-800 truncate">{student.email}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-slate-500 font-medium">Department & Semester</p>
                <p className="font-semibold text-slate-800">{student.department} • Semester {student.semester}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-slate-500 font-medium">Created On (BSON Date)</p>
                <p className="font-semibold text-slate-800">{formattedDate}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
              <Hash className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-slate-500 font-medium">MongoDB Document ID</p>
                <p className="font-mono text-[10px] text-slate-700 truncate" title={student._id || student.id}>
                  {student._id || student.id}
                </p>
              </div>
            </div>
          </div>

          {/* Marks Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-800">Subject Marks Breakdown</h4>
              </div>
              <div className="text-xs text-slate-500">
                Average: <span className="font-bold text-slate-800 text-sm">{student.average_marks}%</span>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              {['DBMS', 'DSA', 'Python'].map((sub) => {
                const score = marks[sub] || 0;
                return (
                  <div key={sub}>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-slate-700">{sub}</span>
                      <span className="font-bold text-slate-800">{score} / 100</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${getScoreColor(score)}`}
                        style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-white transition-colors"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(student);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Record</span>
          </button>
        </div>
      </div>
    </div>
  );
}
