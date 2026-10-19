import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  Trophy,
  Users,
  Award,
  Layers,
  Code2,
  Medal,
  RefreshCw
} from 'lucide-react';
import { apiService } from '../services/api';

const GRADE_COLORS = {
  A: '#10b981',
  B: '#3b82f6',
  C: '#f59e0b',
  D: '#f97316',
  F: '#ef4444',
};

export default function Analytics({ onError }) {
  const [loading, setLoading] = useState(true);
  const [deptCounts, setDeptCounts] = useState([]);
  const [deptAverages, setDeptAverages] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [gradeDist, setGradeDist] = useState([]);
  const [semCounts, setSemCounts] = useState([]);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    try {
      const [countsRes, avgsRes, topRes, gradeRes, semRes] = await Promise.all([
        apiService.getDepartmentCounts(),
        apiService.getDepartmentAverages(),
        apiService.getTopStudents(5),
        apiService.getGradeDistribution(),
        apiService.getSemesterCounts(),
      ]);

      setDeptCounts(countsRes.data || []);
      setDeptAverages(avgsRes.data || []);
      setTopStudents(topRes.data || []);
      setGradeDist(gradeRes.data || []);
      setSemCounts(semRes.data || []);
    } catch (err) {
      if (onError) onError(err.message || 'Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-80 bg-white rounded-2xl border border-slate-200"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="p-6 bg-indigo-900 text-white rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-800 text-indigo-200">
            Intelligent NoSQL Databases (CSE494)
          </span>
          <h2 className="text-xl font-bold mt-2">Real-Time MongoDB Aggregation Pipelines</h2>
          <p className="text-xs text-indigo-200 max-w-2xl mt-1">
            All analytics below are computed directly inside MongoDB using multi-stage aggregation pipelines via PyMongo ($project, $group, $sort, $limit, and $switch).
          </p>
        </div>
        <button
          onClick={fetchAllAnalytics}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-800/80 hover:bg-indigo-700 text-xs font-semibold transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Rerun Pipelines</span>
        </button>
      </div>

      {/* Grid of 5 Aggregation Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. Department-wise Student Count */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-800">1. Department-wise Student Count</h3>
              </div>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                $group + $sort
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Groups records by department and computes total student enrollments.
            </p>

            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptCounts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    cursor={{ fill: '#f1f5f9' }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} name="Students" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 font-mono">
            <strong>Stages:</strong> [{`$group: {_id: "$department", count: {$sum: 1}}`}, {`$sort: {count: -1}}`}]
          </div>
        </div>

        {/* 2. Average Marks by Department */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-800">2. Average Marks by Department</h3>
              </div>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                $project + $group + $avg
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Calculates individual student mean ((DBMS+DSA+Python)/3) then averages by discipline.
            </p>

            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptAverages} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    cursor={{ fill: '#f1f5f9' }}
                  />
                  <Bar dataKey="average_marks" fill="#10b981" radius={[6, 6, 0, 0]} name="Avg Marks (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 font-mono">
            <strong>Stages:</strong> [{`$project: {student_avg: {$divide: [...]}}`}, {`$group: {$avg: "$student_avg"}}`}]
          </div>
        </div>

        {/* 3. Grade Distribution */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-800">3. Academic Grade Distribution</h3>
              </div>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                $switch + $group
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Categorizes each student into canonical letter grades (A &ge; 80, B &ge; 70, C &ge; 60, D &ge; 40, F &lt; 40).
            </p>

            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeDist} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="grade" tick={{ fontSize: 12, fontWeight: 700 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    cursor={{ fill: '#f1f5f9' }}
                  />
                  <Bar dataKey="count" name="Students" radius={[6, 6, 0, 0]}>
                    {gradeDist.map((entry) => (
                      <Cell key={`cell-${entry.grade}`} fill={GRADE_COLORS[entry.grade] || '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 font-mono">
            <strong>Stages:</strong> [{`$project: {grade: {$switch: {branches: [...]}}}`}, {`$group: {_id: "$grade", count: {$sum: 1}}`}]
          </div>
        </div>

        {/* 4. Semester-wise Student Count */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-600" />
                <h3 className="text-sm font-bold text-slate-800">4. Semester-wise Student Count</h3>
              </div>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                $group + $sort (1 to 8)
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Groups by numeric semester (1 to 8) to show cohort distribution.
            </p>

            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={semCounts.map((s) => ({ ...s, name: `Sem ${s.semester}` }))}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    cursor={{ fill: '#f1f5f9' }}
                  />
                  <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} name="Students" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 font-mono">
            <strong>Stages:</strong> [{`$group: {_id: "$semester", count: {$sum: 1}}`}, {`$sort: {_id: 1}}`}]
          </div>
        </div>

      </div>

      {/* 5. Top 5 Students Ranked by Average Marks */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">5. Top 5 Students Ranked by Average Marks</h3>
              <p className="text-xs text-slate-400">
                Calculated via $project average marks, $sort: {`{average_marks: -1}`}, and $limit: 5
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-md font-semibold">
            Pipeline 3: $sort + $limit: 5
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-y border-slate-100">
              <tr>
                <th className="py-3 px-4 font-semibold">Rank</th>
                <th className="py-3 px-4 font-semibold">Student Name</th>
                <th className="py-3 px-4 font-semibold">Roll Number</th>
                <th className="py-3 px-4 font-semibold">Department</th>
                <th className="py-3 px-4 font-semibold">Subject Marks (DBMS/DSA/Python)</th>
                <th className="py-3 px-4 font-semibold">Average Marks</th>
                <th className="py-3 px-4 font-semibold">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topStudents.map((student, idx) => {
                const marks = student.marks || {};
                const isFirst = idx === 0;
                return (
                  <tr key={student.id || student._id} className={isFirst ? 'bg-amber-50/40' : 'hover:bg-slate-50/50'}>
                    <td className="py-3.5 px-4 font-bold">
                      <div className="flex items-center gap-1.5">
                        {idx === 0 ? (
                          <span className="w-6 h-6 rounded-full bg-amber-400 text-white flex items-center justify-center text-xs shadow-sm">
                            1
                          </span>
                        ) : idx === 1 ? (
                          <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-xs">
                            2
                          </span>
                        ) : idx === 2 ? (
                          <span className="w-6 h-6 rounded-full bg-amber-700 text-white flex items-center justify-center text-xs">
                            3
                          </span>
                        ) : (
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs">
                            {idx + 1}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{student.name}</td>
                    <td className="py-3.5 px-4 font-mono font-medium text-indigo-600">{student.roll_no}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{student.department} (Sem {student.semester})</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {marks.DBMS ?? 0} / {marks.DSA ?? 0} / {marks.Python ?? 0}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-indigo-600 text-sm">
                      {student.average_marks}%
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {student.grade}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
