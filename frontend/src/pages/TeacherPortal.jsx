import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  GraduationCap,
  CalendarCheck,
  Award,
  Users,
  BookOpen,
  Bell,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { apiService } from '../services/api';
import Attendance from './Attendance';
import Exams from './Exams';
import Announcements from './Announcements';
import Timetable from './Timetable';

export default function TeacherPortal({ currentUser, showToast }) {
  const [activeView, setActiveView] = useState('overview'); // 'overview' | 'attendance' | 'marks' | 'announcements'

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(currentUser?.teacher_profile || null);
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');

  // Dynamic teacher assigned subjects and department:
  const teacherDept = profile?.department || currentUser?.department || 'IT';

  const assignedSubjects = useMemo(() => {
    const list =
      profile?.assigned_subjects ||
      currentUser?.assigned_subjects ||
      currentUser?.teacher_profile?.assigned_subjects ||
      ['DBMS', 'Python'];
    return Array.isArray(list) ? list : ['DBMS', 'Python'];
  }, [
    profile?.assigned_subjects ? profile.assigned_subjects.join(',') : '',
    currentUser?.assigned_subjects ? currentUser.assigned_subjects.join(',') : '',
    currentUser?.teacher_profile?.assigned_subjects ? currentUser.teacher_profile.assigned_subjects.join(',') : '',
  ]);

  const teacherAssignedClasses = useMemo(() => {
    const list =
      profile?.assigned_classes ||
      currentUser?.assigned_classes ||
      currentUser?.teacher_profile?.assigned_classes ||
      ['AI&DS-Sem4', 'CSE-Sem4', 'IT-Sem4'];
    return Array.isArray(list) ? list : ['AI&DS-Sem4', 'CSE-Sem4', 'IT-Sem4'];
  }, [
    profile?.assigned_classes ? profile.assigned_classes.join(',') : '',
    currentUser?.assigned_classes ? currentUser.assigned_classes.join(',') : '',
    currentUser?.teacher_profile?.assigned_classes ? currentUser.teacher_profile.assigned_classes.join(',') : '',
  ]);

  const teacherAssignedClassesKey = useMemo(() => {
    return teacherAssignedClasses.join(',');
  }, [teacherAssignedClasses]);

  const batchAverage = useMemo(() => {
    if (!students || students.length === 0) return '0.0';
    const total = students.reduce((sum, s) => sum + (Number(s.average_marks) || 0), 0);
    return (total / students.length).toFixed(1);
  }, [students]);

  const teacherContextUser = useMemo(() => ({
    ...currentUser,
    ...profile,
    assigned_subjects: assignedSubjects,
    assigned_classes: teacherAssignedClasses,
  }), [currentUser, profile, assignedSubjects, teacherAssignedClasses]);

  // Dynamically refresh teacher profile from backend to capture any real-time subject reassignments
  useEffect(() => {
    apiService
      .getMe()
      .then((res) => {
        if (res?.user?.teacher_profile) {
          setProfile(res.user.teacher_profile);
        } else if (res?.user?.assigned_subjects) {
          setProfile(res.user);
        }
      })
      .catch(() => {});
  }, []);

  const loadTeacherStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedClassFilter !== 'ALL') {
        params.class_id = selectedClassFilter;
      }

      const res = await apiService.getTeacherStudents(params);
      setStudents(res.students || []);
    } catch (err) {
      showToast(err.message || 'Failed to load assigned students', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedClassFilter, showToast]);

  useEffect(() => {
    loadTeacherStudents();
  }, [loadTeacherStudents]);

  return (
    <div className="space-y-6">
      {/* Teacher Welcome Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center font-bold text-lg text-emerald-300">
              {currentUser?.name?.slice(0, 2).toUpperCase() || 'FC'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight">
                  {currentUser?.name || 'Faculty Portal'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                  Faculty Access
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-1">
                Department: <strong>{teacherDept}</strong> • Assigned Subjects:{' '}
                <strong>{assignedSubjects.join(', ')}</strong> • Teaching Classes:{' '}
                <strong>{teacherAssignedClasses.join(', ')}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveView('timetable')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>My Timetable</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('attendance')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Mark Attendance</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('marks')}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>Enter Marks</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit gap-1">
        <button
          type="button"
          onClick={() => setActiveView('overview')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
            activeView === 'overview'
              ? 'bg-white text-indigo-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          My Classroom Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveView('timetable')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
            activeView === 'timetable'
              ? 'bg-white text-indigo-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          My Class Timetable
        </button>
        <button
          type="button"
          onClick={() => setActiveView('attendance')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
            activeView === 'attendance'
              ? 'bg-white text-indigo-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Take Attendance
        </button>
        <button
          type="button"
          onClick={() => setActiveView('marks')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
            activeView === 'marks'
              ? 'bg-white text-indigo-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Marks Entry
        </button>
        <button
          type="button"
          onClick={() => setActiveView('announcements')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
            activeView === 'announcements'
              ? 'bg-white text-indigo-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Class Notices
        </button>
      </div>

      {/* SUB-VIEW 1: OVERVIEW */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 block mb-1">
                Assigned Students
              </span>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {students.length}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Across {teacherAssignedClasses.length} Allotted Sections
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 block mb-1">
                Active Subjects
              </span>
              <div className="text-2xl font-bold text-emerald-600 font-mono">
                {assignedSubjects.length}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block truncate" title={assignedSubjects.join(', ')}>
                {assignedSubjects.join(', ')}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 block mb-1">
                Assigned Sections
              </span>
              <div className="text-2xl font-bold text-indigo-600 font-mono">
                {teacherAssignedClasses.length}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block truncate" title={teacherAssignedClasses.join(', ')}>
                {teacherAssignedClasses.join(', ')}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 block mb-1">
                Batch Average
              </span>
              <div className="text-2xl font-bold text-amber-500 font-mono">
                {batchAverage}%
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
                {Number(batchAverage) >= 80 ? 'Grade A Tier' : Number(batchAverage) >= 70 ? 'Grade B Tier' : 'Passing Tier'}
              </span>
            </div>
          </div>

          {/* Assigned Students Roster Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Enrolled Students in My Teaching Classes ({students.length})
                </h3>
                <span className="text-xs text-slate-500">
                  Authorized for attendance tracking and marks grading across your assigned batches
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Class Filter:</span>
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                >
                  <option value="ALL">All My Classes ({teacherAssignedClasses.join(', ')})</option>
                  {teacherAssignedClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Loading students...
              </div>
            ) : students.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No students enrolled in the selected teaching class.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Roll No</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Semester</th>
                      <th className="py-3 px-4 text-center">My Subjects Taught</th>
                      <th className="py-3 px-4 text-center">Average Marks</th>
                      <th className="py-3 px-4 text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((s) => (
                      <tr key={s.roll_no} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {s.roll_no}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {s.name}
                        </td>
                        <td className="py-3 px-4 font-bold text-indigo-700">
                          {s.department}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          Semester {s.semester}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex flex-wrap items-center justify-center gap-1">
                            {(s.taught_subjects || assignedSubjects).map((sub) => (
                              <span
                                key={sub}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300"
                              >
                                {sub}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-indigo-600">
                          {s.average_marks}%
                        </td>
                        <td className="py-3 px-4 text-center font-bold">
                          <span
                            className={`px-2 py-0.5 rounded ${
                              s.grade === 'A'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            Grade {s.grade}
                          </span>
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

      {/* SUB-VIEW 2: TIMETABLE */}
      {activeView === 'timetable' && (
        <Timetable
          showToast={showToast}
          userRole="teacher"
          currentUser={teacherContextUser}
        />
      )}

      {/* SUB-VIEW 3: ATTENDANCE */}
      {activeView === 'attendance' && (
        <Attendance
          showToast={showToast}
          defaultDepartment={teacherDept}
          userRole="teacher"
          currentUser={teacherContextUser}
          allowedSubjects={assignedSubjects}
        />
      )}

      {/* SUB-VIEW 4: MARKS */}
      {activeView === 'marks' && (
        <Exams
          showToast={showToast}
          userRole="teacher"
          currentUser={teacherContextUser}
        />
      )}

      {/* SUB-VIEW 5: ANNOUNCEMENTS */}
      {activeView === 'announcements' && (
        <Announcements showToast={showToast} userRole="teacher" />
      )}
    </div>
  );
}
