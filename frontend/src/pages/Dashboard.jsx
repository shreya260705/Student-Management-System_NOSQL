import React from 'react';
import {
  Users,
  Building2,
  Award,
  Trophy,
  ArrowRight,
  TrendingUp,
  BarChart as BarChartIcon
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const GRADE_COLORS = {
  A: '#10b981', // emerald
  B: '#3b82f6', // blue
  C: '#f59e0b', // amber
  D: '#f97316', // orange
  F: '#ef4444', // red
};

const DEPT_COLORS = ['#6366f1', '#06b6d4', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981'];

export default function Dashboard({
  stats,
  loading,
  onViewStudent,
  onNavigateToStudents
}) {
  if (loading && !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-white rounded-2xl border border-slate-200"></div>
          <div className="h-80 bg-white rounded-2xl border border-slate-200"></div>
        </div>
      </div>
    );
  }

  const {
    total_students = 0,
    total_departments = 0,
    overall_average = 0,
    highest_scoring_student = null,
    department_distribution = [],
    grade_distribution = [],
    recent_students = []
  } = stats || {};

  return (
    <div className="space-y-6">
      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Students */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Students</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{total_students}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Enrolled across college</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Academic Departments */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Departments</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{total_departments}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Academic disciplines</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Overall Average */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Score</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{overall_average}%</h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Aggregated overall mean
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Highest Scoring Student */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="max-w-[170px] truncate">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Top Performer</p>
            <h3 className="text-base font-bold text-slate-900 mt-1 truncate" title={highest_scoring_student?.name}>
              {highest_scoring_student?.name || 'N/A'}
            </h3>
            <p className="text-[11px] text-amber-600 font-medium mt-0.5 truncate">
              {highest_scoring_student ? `${highest_scoring_student.average_marks}% (${highest_scoring_student.department})` : 'No data'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department-wise distribution */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Department Distribution</h4>
              <p className="text-xs text-slate-400">Calculated via MongoDB $group by department</p>
            </div>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <BarChartIcon className="w-4 h-4" />
            </div>
          </div>

          <div className="h-64">
            {department_distribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No student data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={department_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    cursor={{ fill: '#f1f5f9' }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} name="Students" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Academic Grade Distribution</h4>
              <p className="text-xs text-slate-400">Calculated via MongoDB $switch & $group</p>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Award className="w-4 h-4" />
            </div>
          </div>

          <div className="h-64">
            {grade_distribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No grade data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={grade_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="grade" tick={{ fontSize: 12, fontWeight: 600 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    cursor={{ fill: '#f1f5f9' }}
                  />
                  <Bar dataKey="count" name="Students" radius={[6, 6, 0, 0]}>
                    {grade_distribution.map((entry) => (
                      <Cell key={`cell-${entry.grade}`} fill={GRADE_COLORS[entry.grade] || '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recently Enrolled Students Table */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-800">Recently Enrolled Students</h4>
            <p className="text-xs text-slate-400">Sorted by native MongoDB BSON Date (created_at desc)</p>
          </div>
          <button
            onClick={onNavigateToStudents}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <span>View All Students</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recent_students.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No recent students found in MongoDB collection.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-y border-slate-100">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Roll Number</th>
                  <th className="py-2.5 px-4 font-semibold">Student Name</th>
                  <th className="py-2.5 px-4 font-semibold">Department</th>
                  <th className="py-2.5 px-4 font-semibold">Semester</th>
                  <th className="py-2.5 px-4 font-semibold">Average</th>
                  <th className="py-2.5 px-4 font-semibold">Grade</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent_students.map((student) => (
                  <tr key={student.id || student._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-indigo-600">{student.roll_no}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{student.name}</td>
                    <td className="py-3 px-4 text-slate-600">{student.department}</td>
                    <td className="py-3 px-4 text-slate-600">Sem {student.semester}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{student.average_marks}%</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        student.grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                        student.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                        student.grade === 'C' ? 'bg-amber-100 text-amber-800' :
                        student.grade === 'D' ? 'bg-orange-100 text-orange-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {student.grade}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onViewStudent(student)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                      >
                        Details
                      </button>
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
