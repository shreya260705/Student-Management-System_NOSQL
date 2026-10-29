import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  BookOpen,
  User,
  MapPin,
  X,
  Filter,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { apiService } from '../services/api';

const DEPARTMENTS = ['CSE', 'IT', 'AI&DS', 'ECE', 'MECH', 'CIVIL'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function Timetable({ showToast, userRole = 'admin', currentUser }) {
  const isTeacher = userRole === 'teacher';
  const isStudent = userRole === 'student';
  const teacherName = currentUser?.name || '';
  const teacherDept = currentUser?.department || 'IT';

  const studentRollNo =
    currentUser?.associated_id ||
    currentUser?.roll_no ||
    currentUser?.student_profile?.roll_no ||
    'CSE2024001';
  const studentDept =
    currentUser?.department || currentUser?.student_profile?.department || 'CSE';
  const studentSem =
    currentUser?.semester || currentUser?.student_profile?.semester || 4;

  const enrolledSubjectsKey = useMemo(() => {
    const list =
      currentUser?.enrolled_subjects ||
      currentUser?.student_profile?.enrolled_subjects ||
      (currentUser?.student_profile?.marks
        ? Object.keys(currentUser.student_profile.marks)
        : ['DBMS', 'DSA', 'Python']);
    return Array.isArray(list) ? list.join(',') : '';
  }, [
    currentUser?.enrolled_subjects,
    currentUser?.student_profile?.enrolled_subjects,
    currentUser?.student_profile?.marks,
  ]);

  const enrolledSubjects = useMemo(() => {
    return enrolledSubjectsKey ? enrolledSubjectsKey.split(',') : [];
  }, [enrolledSubjectsKey]);

  const teacherAllowedDepts = useMemo(() => {
    if (!isTeacher) return DEPARTMENTS;
    const depts = new Set([teacherDept]);
    const classes = currentUser?.assigned_classes || [];
    classes.forEach((c) => {
      const parts = c.split('-');
      if (parts[0]) depts.add(parts[0].trim().toUpperCase());
    });
    return Array.from(depts);
  }, [isTeacher, teacherDept, currentUser?.assigned_classes ? currentUser.assigned_classes.join(',') : '']);

  const teacherAssignedSubjects = useMemo(() => {
    const list =
      currentUser?.assigned_subjects ||
      currentUser?.teacher_profile?.assigned_subjects ||
      ['DBMS', 'Python'];
    return Array.isArray(list) ? list : ['DBMS', 'Python'];
  }, [
    currentUser?.assigned_subjects ? currentUser.assigned_subjects.join(',') : '',
    currentUser?.teacher_profile?.assigned_subjects ? currentUser.teacher_profile.assigned_subjects.join(',') : '',
  ]);

  const teacherAssignedSubjectsKey = useMemo(() => {
    return teacherAssignedSubjects.join(',');
  }, [teacherAssignedSubjects]);

  const [department, setDepartment] = useState(
    isTeacher ? 'ALL' : (isStudent ? studentDept : 'CSE')
  );
  const [semester, setSemester] = useState(isStudent ? studentSem : 4);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewScope, setViewScope] = useState(isTeacher || isStudent ? 'my' : 'all'); // 'my' | 'all'

  // Add slot modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSlot, setNewSlot] = useState({
    day: 'Monday',
    time_slot: '09:00 - 10:00',
    subject: 'DBMS',
    teacher: isTeacher ? (teacherName || 'Faculty') : 'Dr. Ramesh Gupta',
    room: 'Lab 3',
  });

  const loadTimetable = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (isTeacher && viewScope === 'my') {
        params.scope = 'my';
        params.teacher = teacherName;
        if (teacherAssignedSubjectsKey) {
          params.subjects = teacherAssignedSubjectsKey;
        }
        if (department && department !== 'ALL') {
          params.department = department;
        }
      } else if (isStudent && viewScope === 'my') {
        params.scope = 'my';
        params.student = studentRollNo;
        params.department = studentDept;
        params.semester = studentSem;
        if (enrolledSubjectsKey) {
          params.subjects = enrolledSubjectsKey;
        }
      } else {
        params.scope = 'all';
        params.department =
          department && department !== 'ALL'
            ? department
            : isTeacher
            ? teacherDept || 'IT'
            : isStudent
            ? studentDept || 'CSE'
            : 'CSE';
        params.semester = semester;
      }

      const res = await apiService.getTimetable(params);
      setSlots(res.timetable || []);
    } catch (err) {
      showToast(err.message || 'Failed to load timetable', 'error');
    } finally {
      setLoading(false);
    }
  }, [
    department,
    semester,
    isTeacher,
    isStudent,
    viewScope,
    teacherName,
    teacherDept,
    studentRollNo,
    studentDept,
    studentSem,
    enrolledSubjectsKey,
    teacherAssignedSubjectsKey,
    showToast,
  ]);

  useEffect(() => {
    loadTimetable();
  }, [loadTimetable]);

  const handleScopeChange = (scope) => {
    setViewScope(scope);
    if (scope === 'all' && department === 'ALL') {
      setDepartment(isTeacher ? (teacherDept || 'IT') : (studentDept || 'CSE'));
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    try {
      await apiService.addTimetableSlot({
        ...newSlot,
        department: department === 'ALL' ? (isTeacher ? teacherDept : 'CSE') : department,
        semester: Number(semester),
      });
      showToast('Timetable slot added successfully!', 'success');
      setIsAddOpen(false);
      loadTimetable();
    } catch (err) {
      showToast(err.message || 'Failed to add slot', 'error');
    }
  };

  const handleDeleteSlot = async (id) => {
    if (!window.confirm('Delete this schedule slot?')) return;
    try {
      await apiService.deleteTimetableSlot(id);
      showToast('Slot removed.', 'success');
      loadTimetable();
    } catch (err) {
      showToast(err.message || 'Failed to delete slot', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-7 h-7 text-indigo-600" />
            {isTeacher
              ? (viewScope === 'my'
                  ? 'My Teaching Timetable'
                  : `${department === 'ALL' ? (teacherDept || 'IT') : department} Semester ${semester} Full Timetable`)
              : isStudent
              ? (viewScope === 'my'
                  ? 'My Weekly Class Schedule'
                  : `${department} Semester ${semester} Full Department Timetable`)
              : 'Class Timetable & Schedules'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isTeacher
              ? (viewScope === 'my'
                  ? `Personalized weekly lecture schedule for ${teacherName || 'Faculty'}. Displaying only your assigned classes and lecture halls.`
                  : `Full department weekly lecture schedule for ${department === 'ALL' ? (teacherDept || 'IT') : department} Semester ${semester}. Shows all class lectures and assigned instructors.`)
              : isStudent
              ? (viewScope === 'my'
                  ? `Personalized weekly lecture schedule for ${currentUser?.name || 'Student'}. Showing only classes for your enrolled subjects: ${enrolledSubjects.join(', ')} (${studentDept} Sem ${studentSem}).`
                  : `Full department weekly lecture schedule for ${department} Semester ${semester}. Shows all class lectures across all department subjects.`)
              : 'Weekly lecture schedules, course timings, faculty allocations, and lecture halls.'}
          </p>
        </div>

        {!isTeacher && !isStudent && (
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lecture Slot</span>
          </button>
        )}
      </div>

      {/* Filter / Scope Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {isTeacher && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold shadow-xs">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>Instructor: {teacherName || 'Faculty'}</span>
            </div>
          )}

          {isStudent && viewScope === 'my' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-bold shadow-xs">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Enrolled Subjects: {enrolledSubjects.join(', ')}</span>
            </div>
          )}

          {(!isStudent || viewScope === 'all') && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-700">Department:</span>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className={`px-3 py-1.5 text-xs rounded-lg focus:outline-none focus:ring-2 font-bold ${
                  isTeacher && !teacherAllowedDepts.includes(department) && department !== 'ALL'
                    ? 'bg-amber-50 text-amber-900 border border-amber-300 focus:ring-amber-500'
                    : 'bg-slate-50 border border-slate-200 focus:ring-indigo-500'
                }`}
              >
                {isTeacher && viewScope === 'my' && (
                  <option value="ALL">All My Teaching Departments ({teacherAllowedDepts.join(', ')})</option>
                )}
                {DEPARTMENTS.map((d) => {
                  let label = d;
                  if (isTeacher) {
                    if (d === teacherDept) {
                      label = `${d} • (Home Dept)`;
                    } else if (teacherAllowedDepts.includes(d)) {
                      label = `${d} • (Teaching Branch)`;
                    } else {
                      label = `${d} • (Not your department)`;
                    }
                  }
                  return (
                    <option key={d} value={d}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {((!isTeacher && !isStudent) || viewScope === 'all') && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Semester:</span>
              <select
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {isTeacher && (
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => handleScopeChange('my')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                viewScope === 'my'
                  ? 'bg-white text-indigo-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Lectures Only
            </button>
            <button
              type="button"
              onClick={() => handleScopeChange('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                viewScope === 'all'
                  ? 'bg-white text-indigo-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Full Department Timetable
            </button>
          </div>
        )}

        {isStudent && (
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => handleScopeChange('my')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                viewScope === 'my'
                  ? 'bg-white text-indigo-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Enrolled Classes
            </button>
            <button
              type="button"
              onClick={() => handleScopeChange('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                viewScope === 'all'
                  ? 'bg-white text-indigo-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Full Department Timetable
            </button>
          </div>
        )}
      </div>

      {/* Teacher Non-Assigned Department Notice */}
      {isTeacher && !teacherAllowedDepts.includes(department) && department !== 'ALL' && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <strong className="font-bold">Department Restriction Notice:</strong> You are viewing timetable slots for the <strong>{department}</strong> department, which is outside your assigned teaching scope ({teacherAllowedDepts.join(', ')}). Timetable slots below are displayed in cross-department audit mode.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDepartment(teacherDept)}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition cursor-pointer self-start sm:self-auto shrink-0 flex items-center gap-1.5 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Switch Back to {teacherDept} (Home Department)</span>
          </button>
        </div>
      )}

      {/* Timetable Weekly Columns */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading weekly schedule...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {DAYS.map((day) => {
            const daySlots = slots.filter((s) => {
              if (s.day !== day) return false;
              if (isTeacher && viewScope === 'my') {
                if (teacherAssignedSubjects && teacherAssignedSubjects.length > 0) {
                  const allowedSubjectsLower = teacherAssignedSubjects.map((sub) => sub.toLowerCase().trim());
                  const slotSub = (s.subject || '').toLowerCase().trim();
                  if (!allowedSubjectsLower.includes(slotSub)) return false;
                }
                return true;
              }
              if (isStudent && viewScope === 'my') {
                if (enrolledSubjects && enrolledSubjects.length > 0) {
                  const enrolledLower = enrolledSubjects.map((sub) => sub.toLowerCase().trim());
                  return enrolledLower.includes((s.subject || '').toLowerCase().trim());
                }
              }
              return true;
            });

            return (
              <div
                key={day}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
              >
                {/* Day Header */}
                <div className="bg-indigo-900 text-white p-3 text-center">
                  <h3 className="font-bold text-xs uppercase tracking-wider">
                    {day}
                  </h3>
                  <span className="text-[10px] text-indigo-200">
                    {daySlots.length} {isTeacher && viewScope === 'my' ? 'My Class' : isStudent && viewScope === 'my' ? 'Enrolled Class' : 'Lecture'}{daySlots.length === 1 ? '' : 'es'}
                  </span>
                </div>

                {/* Day Slots */}
                <div className="p-3 flex-1 space-y-2.5">
                  {daySlots.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-[11px]">
                      {isTeacher && viewScope === 'my'
                        ? 'No lectures scheduled for you'
                        : isStudent && viewScope === 'my'
                        ? 'No enrolled classes today'
                        : 'No lectures scheduled'}
                    </div>
                  ) : (
                    daySlots.map((slot) => {
                      const isAssignedToMe = Boolean(
                        teacherName &&
                        slot.teacher &&
                        (slot.teacher.toLowerCase().includes(teacherName.toLowerCase()) ||
                          teacherName.toLowerCase().includes(slot.teacher.toLowerCase())) &&
                        (!teacherAssignedSubjects || teacherAssignedSubjects.length === 0 ||
                          teacherAssignedSubjects.map((sub) => sub.toLowerCase().trim()).includes((slot.subject || '').toLowerCase().trim()))
                      );

                      const isEnrolledSub = Boolean(
                        isStudent &&
                        enrolledSubjects &&
                        enrolledSubjects.map((sub) => sub.toLowerCase().trim()).includes((slot.subject || '').toLowerCase().trim())
                      );

                      return (
                        <div
                          key={slot.id || slot._id}
                          className={`p-3 rounded-xl border transition group relative ${
                            isTeacher && isAssignedToMe
                              ? 'bg-emerald-50/70 border-emerald-300 hover:border-emerald-500 shadow-xs'
                              : isStudent && isEnrolledSub
                              ? 'bg-indigo-50/40 border-indigo-200 hover:border-indigo-400 shadow-xs'
                              : 'bg-slate-50 border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          {!isTeacher && !isStudent && (
                            <button
                              type="button"
                              onClick={() => handleDeleteSlot(slot.id || slot._id)}
                              className="absolute top-2 right-2 p-1 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                              title="Remove Slot"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <div className="text-[10px] font-mono font-bold text-indigo-700 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{slot.time_slot}</span>
                            </div>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 shrink-0">
                              {slot.department} Sem {slot.semester}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-bold text-slate-900 text-xs">
                              {slot.subject}
                            </span>
                            {isStudent && isEnrolledSub && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                                Enrolled
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-600 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className={isAssignedToMe ? 'font-bold text-emerald-800' : 'font-medium'}>
                              {slot.teacher} {isTeacher && isAssignedToMe ? '• (You)' : ''}
                            </span>
                          </div>

                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>Room: {slot.room || 'TBD'}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Slot Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 relative">
            <button
              onClick={() => setIsAddOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Add Schedule Lecture
            </h2>
            <form onSubmit={handleAddSlot} className="space-y-3.5 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Day of Week
                  </label>
                  <select
                    value={newSlot.day}
                    onChange={(e) =>
                      setNewSlot({ ...newSlot, day: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Time Slot
                  </label>
                  <input
                    type="text"
                    placeholder="09:00 - 10:00"
                    value={newSlot.time_slot}
                    onChange={(e) =>
                      setNewSlot({ ...newSlot, time_slot: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DBMS"
                  value={newSlot.subject}
                  onChange={(e) =>
                    setNewSlot({ ...newSlot, subject: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Instructor Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Ramesh Gupta"
                  value={newSlot.teacher}
                  onChange={(e) =>
                    setNewSlot({ ...newSlot, teacher: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Classroom / Hall
                </label>
                <input
                  type="text"
                  placeholder="e.g. Room 302 or Lab 3"
                  value={newSlot.room}
                  onChange={(e) =>
                    setNewSlot({ ...newSlot, room: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Save Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
