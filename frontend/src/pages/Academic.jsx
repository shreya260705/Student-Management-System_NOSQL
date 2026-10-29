import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpen,
  Layers,
  GraduationCap,
  Plus,
  Users,
  Clock,
  X,
  AlertCircle,
  UserCheck,
  Shield,
  Filter,
  CheckCircle2,
  Trash2,
  Edit2,
} from 'lucide-react';
import { apiService } from '../services/api';

const DEPARTMENTS = ['CSE', 'IT', 'AI&DS', 'ECE', 'MECH', 'CIVIL'];

export default function Academic({ showToast }) {
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' | 'classes' | 'subjects' | 'allocations'

  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Allocation filter states
  const [allocFilterDept, setAllocFilterDept] = useState('ALL');
  const [allocFilterSem, setAllocFilterSem] = useState('ALL');

  // Modals
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({
    course_code: '',
    course_name: '',
    department: 'CSE',
    duration_semesters: 8,
  });

  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [newClass, setNewClass] = useState({
    class_id: '',
    class_name: '',
    department: 'CSE',
    semester: 4,
    section: 'A',
  });

  // Allocation modal
  const [isAddAllocOpen, setIsAddAllocOpen] = useState(false);
  const [savingAlloc, setSavingAlloc] = useState(false);
  const [newAlloc, setNewAlloc] = useState({
    department: 'CSE',
    semester: 4,
    section: 'A',
    subject: 'DBMS',
    teacher_id: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'courses') {
        const res = await apiService.getCourses();
        setCourses(res.courses || []);
      } else if (activeTab === 'classes') {
        const [clsRes, allocRes] = await Promise.all([
          apiService.getClasses(),
          apiService.getAllocations(),
        ]);
        setClasses(clsRes.classes || []);
        setAllocations(allocRes.allocations || []);
      } else if (activeTab === 'subjects') {
        const res = await apiService.getSubjects();
        setSubjects(res.subjects || []);
      } else if (activeTab === 'allocations') {
        const [allocRes, teachersRes, subsRes] = await Promise.all([
          apiService.getAllocations(),
          apiService.getTeachers({ limit: 100 }),
          apiService.getSubjects(),
        ]);
        setAllocations(allocRes.allocations || []);
        setTeachersList(teachersRes.teachers || []);
        setSubjects(subsRes.subjects || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load academic data', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      await apiService.createCourse(newCourse);
      showToast('Academic course registered successfully!', 'success');
      setIsAddCourseOpen(false);
      setNewCourse({
        course_code: '',
        course_name: '',
        department: 'CSE',
        duration_semesters: 8,
      });
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to create course', 'error');
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      const cid =
        newClass.class_id ||
        `${newClass.department}-Sem${newClass.semester}-${newClass.section}`;
      await apiService.createClass({
        ...newClass,
        class_id: cid,
        class_name:
          newClass.class_name ||
          `${newClass.department} Semester ${newClass.semester} (Sec ${newClass.section})`,
      });
      showToast('Class section created successfully!', 'success');
      setIsAddClassOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to create class', 'error');
    }
  };

  const filteredAllocations = useMemo(() => {
    return allocations.filter((a) => {
      if (allocFilterDept !== 'ALL' && a.department !== allocFilterDept) return false;
      if (allocFilterSem !== 'ALL' && String(a.semester) !== String(allocFilterSem)) return false;
      return true;
    });
  }, [allocations, allocFilterDept, allocFilterSem]);

  const handleCreateAllocation = async (e) => {
    e.preventDefault();
    if (!newAlloc.teacher_id) {
      showToast('Please select a faculty instructor.', 'warning');
      return;
    }
    setSavingAlloc(true);
    try {
      const res = await apiService.createAllocation(newAlloc);
      showToast(res.message || 'Faculty successfully allotted to Section & Subject!', 'success');
      setIsAddAllocOpen(false);
      const allocRes = await apiService.getAllocations();
      setAllocations(allocRes.allocations || []);
    } catch (err) {
      showToast(err.message || 'Failed to allot faculty', 'error');
    } finally {
      setSavingAlloc(false);
    }
  };

  const handleDeleteAllocation = async (id, subject, dept, sem) => {
    if (!window.confirm(`Remove faculty allotment for ${dept} Sem ${sem} (${subject})?`)) return;
    try {
      await apiService.deleteAllocation(id);
      showToast('Allocation removed.', 'success');
      const allocRes = await apiService.getAllocations();
      setAllocations(allocRes.allocations || []);
    } catch (err) {
      showToast(err.message || 'Failed to delete allocation', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-indigo-600" />
            Academic Curriculum & Allocations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage degree programs, classroom sections, syllabus courses, and faculty section allocations.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'courses'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Programs & Courses
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('classes')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'classes'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Classes & Sections
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('subjects')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'subjects'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Curriculum Subjects
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('allocations')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'allocations'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Faculty Allocation</span>
          </button>
        </div>
      </div>

      {/* TAB 1: COURSES */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsAddCourseOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Degree Course</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((c) => (
              <div
                key={c.course_code || c.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-mono font-bold text-xs border border-indigo-100">
                    {c.course_code}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {c.duration_semesters || 8} Semesters
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  {c.course_name}
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Department: <strong className="text-slate-700">{c.department}</strong>
                </p>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Enrolled Students</span>
                  <span className="font-mono font-bold text-indigo-600 text-sm">
                    {c.student_count ?? 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: CLASSES */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsAddClassOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Class Section</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Class ID</th>
                  <th className="py-3 px-4">Class Title</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Semester</th>
                  <th className="py-3 px-4">Section</th>
                  <th className="py-3 px-4 text-center">Enrolled Students</th>
                  <th className="py-3 px-4">Allotted Faculty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classes.map((cl) => {
                  const classAllocs = allocations.filter(
                    (a) => a.class_id === cl.class_id || (a.department === cl.department && a.semester === cl.semester)
                  );
                  const teacherNames = Array.from(new Set(classAllocs.map((a) => a.teacher_name))).filter(Boolean);

                  return (
                    <tr key={cl.class_id || cl.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {cl.class_id}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {cl.class_name}
                      </td>
                      <td className="py-3 px-4">{cl.department}</td>
                      <td className="py-3 px-4">Semester {cl.semester}</td>
                      <td className="py-3 px-4 font-mono">{cl.section || 'A'}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-indigo-600">
                        {cl.enrolled_students ?? 0}
                      </td>
                      <td className="py-3 px-4">
                        {teacherNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {teacherNames.map((tn, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                                {tn}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">None allotted</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SUBJECTS */}
      {activeTab === 'subjects' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Prescribed Subject Syllabus
            </h3>
            <span className="text-xs text-slate-500">
              Evaluated with minimum 40% passing standard
            </span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Subject Code</th>
                <th className="py-3 px-4">Subject Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Semester</th>
                <th className="py-3 px-4 text-center">Credits</th>
                <th className="py-3 px-4 text-center">Max Marks</th>
                <th className="py-3 px-4 text-center">Pass Marks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map((s) => (
                <tr key={s.subject_code || s.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {s.subject_code}
                  </td>
                  <td className="py-3 px-4 font-bold text-indigo-950">
                    {s.name}
                  </td>
                  <td className="py-3 px-4">{s.department}</td>
                  <td className="py-3 px-4">Sem {s.semester}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold">
                    {s.credits || 4}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-600">
                    {s.max_marks || 100}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-emerald-600 font-bold">
                    {s.pass_marks || 40}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: FACULTY SECTION ALLOCATION */}
      {activeTab === 'allocations' && (
        <div className="space-y-6">
          {/* Top Allocation Banner */}
          <div className="p-5 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Admin Authority Controlled
                </span>
                <span className="text-xs text-indigo-200">
                  Real-time Portal Synchronization
                </span>
              </div>
              <h2 className="text-lg font-black tracking-tight">
                Section & Faculty Allotment Engine
              </h2>
              <p className="text-xs text-indigo-200/80 max-w-2xl">
                The Administrator decides which faculty instructor is allotted to teach each class section and subject. Teacher portals (attendance marking, marks entry, timetable) and student portals dynamically synchronize with these allocations.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (teachersList.length === 0) {
                  apiService.getTeachers({ limit: 100 }).then((res) => setTeachersList(res.teachers || []));
                }
                setIsAddAllocOpen(true);
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Allot Faculty to Section</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-700">Filter Department:</span>
                <select
                  value={allocFilterDept}
                  onChange={(e) => setAllocFilterDept(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                >
                  <option value="ALL">All Departments</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Semester:</span>
                <select
                  value={allocFilterSem}
                  onChange={(e) => setAllocFilterSem(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                >
                  <option value="ALL">All Semesters</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={String(s)}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing <strong className="text-slate-900">{filteredAllocations.length}</strong> active section allotments
            </div>
          </div>

          {/* Allocations Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Class Section</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Allotted Faculty Instructor</th>
                  <th className="py-3 px-4">Faculty Dept</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAllocations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No section allotments found for the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAllocations.map((a) => (
                    <tr key={a._id || `${a.department}-${a.semester}-${a.subject}`} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {a.department}-Sem{a.semester} (Sec {a.section || 'A'})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-indigo-950">
                        {a.subject}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px]">
                            {a.teacher_name?.slice(0, 2).toUpperCase() || 'FC'}
                          </div>
                          <div>
                            <strong className="block text-slate-900">{a.teacher_name}</strong>
                            <span className="text-[10px] text-slate-400 font-mono">{a.teacher_id} • {a.teacher_email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-600">
                        {a.teacher_department || a.department}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Allotted & Active
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (teachersList.length === 0) {
                                apiService.getTeachers({ limit: 100 }).then((res) => setTeachersList(res.teachers || []));
                              }
                              setNewAlloc({
                                department: a.department,
                                semester: a.semester,
                                section: a.section || 'A',
                                subject: a.subject,
                                teacher_id: a.teacher_id || '',
                              });
                              setIsAddAllocOpen(true);
                            }}
                            className="px-2.5 py-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 font-bold rounded-lg transition cursor-pointer"
                            title="Reassign Faculty"
                          >
                            Reallot
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAllocation(a._id, a.subject, a.department, a.semester)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Delete Allocation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {isAddCourseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 relative">
            <button
              onClick={() => setIsAddCourseOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Add Academic Course
            </h2>
            <form onSubmit={handleCreateCourse} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Course Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI&DS"
                  value={newCourse.course_code}
                  onChange={(e) =>
                    setNewCourse({
                      ...newCourse,
                      course_code: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Course Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Artificial Intelligence & Data Science"
                  value={newCourse.course_name}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, course_name: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    value={newCourse.department}
                    onChange={(e) =>
                      setNewCourse({
                        ...newCourse,
                        department: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Duration (Semesters)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newCourse.duration_semesters}
                    onChange={(e) =>
                      setNewCourse({
                        ...newCourse,
                        duration_semesters: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCourseOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Class Modal */}
      {isAddClassOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 relative">
            <button
              onClick={() => setIsAddClassOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Create Class Section
            </h2>
            <form onSubmit={handleCreateClass} className="space-y-3.5 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    value={newClass.department}
                    onChange={(e) =>
                      setNewClass({ ...newClass, department: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Semester
                  </label>
                  <select
                    value={newClass.semester}
                    onChange={(e) =>
                      setNewClass({
                        ...newClass,
                        semester: Number(e.target.value),
                      })
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Section Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. A or B"
                  value={newClass.section}
                  onChange={(e) =>
                    setNewClass({
                      ...newClass,
                      section: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddClassOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Create Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allot Faculty to Section Modal */}
      {isAddAllocOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 relative">
            <button
              onClick={() => setIsAddAllocOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                <UserCheck className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Allot Faculty to Section & Subject
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Allotted instructor will have exclusive rights to take attendance, enter subject marks, and appear in student weekly timetables.
            </p>

            <form onSubmit={handleCreateAllocation} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    value={newAlloc.department}
                    onChange={(e) =>
                      setNewAlloc({ ...newAlloc, department: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Semester
                  </label>
                  <select
                    value={newAlloc.semester}
                    onChange={(e) =>
                      setNewAlloc({
                        ...newAlloc,
                        semester: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A"
                    value={newAlloc.section}
                    onChange={(e) =>
                      setNewAlloc({
                        ...newAlloc,
                        section: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. DBMS, Python, DSA"
                    value={newAlloc.subject}
                    onChange={(e) =>
                      setNewAlloc({ ...newAlloc, subject: e.target.value })
                    }
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                  {subjects.length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          setNewAlloc({ ...newAlloc, subject: e.target.value });
                        }
                      }}
                      className="px-2 py-1 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-600"
                    >
                      <option value="">Quick Pick</option>
                      {Array.from(new Set(subjects.map((s) => s.name))).map((sName) => (
                        <option key={sName} value={sName}>
                          {sName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Allotted Faculty Member
                </label>
                <select
                  required
                  value={newAlloc.teacher_id}
                  onChange={(e) =>
                    setNewAlloc({ ...newAlloc, teacher_id: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                >
                  <option value="">-- Choose Instructor --</option>
                  {teachersList.map((t) => (
                    <option key={t.teacher_id || t.id || t._id} value={t.teacher_id || t.id || t._id}>
                      {t.name} • ({t.teacher_id || 'FC'} • {t.department} Dept)
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Assigning this faculty will automatically authorize them for this class batch and subject across all three portals.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddAllocOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAlloc}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingAlloc ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving & Synchronizing...</span>
                    </>
                  ) : (
                    <span>Allot & Synchronize Portals</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
