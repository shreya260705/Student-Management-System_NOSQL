import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Award,
  FileText,
  Printer,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Save,
  Plus,
  BookOpen,
  Check,
  Search,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { apiService } from '../services/api';

const SUBJECTS = ['DBMS', 'DSA', 'Python'];

export default function Exams({ showToast, userRole = 'admin', currentUser }) {
  const isStudent = userRole === 'student';
  const isTeacher = userRole === 'teacher';
  const studentRollNo = currentUser?.associated_id || currentUser?.roll_no || currentUser?.student_profile?.roll_no || 'CSE2024001';

  // Dynamic teacher assigned subjects and classes
  const teacherAssignedSubjects =
    currentUser?.assigned_subjects ||
    currentUser?.teacher_profile?.assigned_subjects ||
    (isTeacher ? ['DBMS', 'Python'] : null);

  const availableSubjects =
    isTeacher && teacherAssignedSubjects && teacherAssignedSubjects.length > 0
      ? teacherAssignedSubjects
      : SUBJECTS;

  const teacherAssignedClasses = useMemo(() => {
    const list =
      currentUser?.assigned_classes ||
      currentUser?.teacher_profile?.assigned_classes ||
      ['AI&DS-Sem4', 'CSE-Sem4', 'IT-Sem4'];
    return Array.isArray(list) ? list : ['AI&DS-Sem4', 'CSE-Sem4', 'IT-Sem4'];
  }, [
    currentUser?.assigned_classes ? currentUser.assigned_classes.join(',') : '',
    currentUser?.teacher_profile?.assigned_classes ? currentUser.teacher_profile.assigned_classes.join(',') : '',
  ]);

  const teacherAssignedClassesKey = useMemo(() => {
    return teacherAssignedClasses.join(',');
  }, [teacherAssignedClasses]);

  const [activeTab, setActiveTab] = useState(isStudent ? 'report' : (isTeacher ? 'marks' : 'exams')); // 'exams' | 'marks' | 'report'

  // Enforce role isolation: Official Report Cards are strictly exclusive to Student Portal
  useEffect(() => {
    if (!isStudent && activeTab === 'report') {
      setActiveTab(isTeacher ? 'marks' : 'exams');
    }
  }, [isStudent, isTeacher, activeTab]);

  // Exams list
  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamTerm, setNewExamTerm] = useState('End-Term');

  // Batch marks entry state
  const [selectedSubject, setSelectedSubject] = useState(
    isTeacher && availableSubjects.length > 0 ? availableSubjects[0] : 'DBMS'
  );
  const [selectedBatch, setSelectedBatch] = useState('ALL'); // 'ALL' | 'CSE-Sem4' | 'IT-Sem4'
  const [studentScores, setStudentScores] = useState([]);
  const [loadingScores, setLoadingScores] = useState(false);
  const [savingMarks, setSavingMarks] = useState(false);

  // Keep selectedSubject in sync if availableSubjects updates
  useEffect(() => {
    if (availableSubjects.length > 0 && !availableSubjects.includes(selectedSubject)) {
      setSelectedSubject(availableSubjects[0]);
    }
  }, [availableSubjects, selectedSubject]);

  // Report card state
  const [selectedRollNo, setSelectedRollNo] = useState(isStudent ? studentRollNo : 'CSE2024001');
  const [reportCard, setReportCard] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // 1. Fetch Exams
  const loadExams = useCallback(async () => {
    setLoadingExams(true);
    try {
      const res = await apiService.getExams();
      setExams(res.exams || []);
    } catch (err) {
      showToast(err.message || 'Failed to load exams', 'error');
    } finally {
      setLoadingExams(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!isStudent && !isTeacher) {
      loadExams();
    }
  }, [isStudent, isTeacher, loadExams]);

  // 2. Load students for batch marks entry
  const loadStudentsForMarks = useCallback(async () => {
    setLoadingScores(true);
    try {
      let students = [];
      if (isTeacher) {
        const params = { subject: selectedSubject };
        if (selectedBatch && selectedBatch !== 'ALL') {
          params.class_id = selectedBatch;
        }
        const res = await apiService.getTeacherStudents(params);
        students = res.students || [];
      } else {
        const params = { limit: 100, subject: selectedSubject };
        if (selectedBatch && selectedBatch !== 'ALL') {
          params.classes = selectedBatch;
        }
        const res = await apiService.getStudents(params);
        students = res.students || [];
      }

      const mapped = students.map((s) => ({
        roll_no: s.roll_no,
        name: s.name,
        department: s.department,
        semester: s.semester,
        score: s.marks?.[selectedSubject] ?? 75,
      }));
      setStudentScores(mapped);
    } catch (err) {
      showToast(err.message || 'Failed to load student list', 'error');
    } finally {
      setLoadingScores(false);
    }
  }, [selectedSubject, selectedBatch, isTeacher, showToast]);

  useEffect(() => {
    if (activeTab === 'marks') {
      loadStudentsForMarks();
    }
  }, [activeTab, selectedSubject, selectedBatch, loadStudentsForMarks]);

  // 3. Load report card
  const loadReportCard = useCallback(
    async (rollNo) => {
      if (!rollNo) return;
      setLoadingReport(true);
      try {
        const res = await apiService.getReportCard(rollNo);
        setReportCard(res.report_card);
      } catch (err) {
        showToast(err.message || 'Failed to generate report card', 'error');
      } finally {
        setLoadingReport(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (activeTab === 'report' && selectedRollNo) {
      loadReportCard(selectedRollNo);
    }
  }, [activeTab, selectedRollNo, loadReportCard]);

  // Handle Exam creation
  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (!newExamTitle.trim()) return;
    try {
      await apiService.createExam({
        title: newExamTitle.trim(),
        term: newExamTerm,
        is_published: true,
      });
      setNewExamTitle('');
      showToast('New examination created successfully!', 'success');
      loadExams();
    } catch (err) {
      showToast(err.message || 'Failed to create exam', 'error');
    }
  };

  // Toggle publish
  const handleTogglePublish = async (examId) => {
    try {
      const res = await apiService.togglePublishExam(examId);
      showToast(res.message, 'success');
      loadExams();
    } catch (err) {
      showToast(err.message || 'Failed to update exam status', 'error');
    }
  };

  // Batch marks save
  const handleScoreChange = (rollNo, val) => {
    setStudentScores((prev) =>
      prev.map((s) => (s.roll_no === rollNo ? { ...s, score: val } : s))
    );
  };

  const handleSaveBatchMarks = async () => {
    setSavingMarks(true);
    try {
      const payload = {
        subject: selectedSubject,
        scores: studentScores.map((s) => ({
          roll_no: s.roll_no,
          score: Number(s.score) || 0,
        })),
      };
      const res = await apiService.batchUpdateMarks(payload);
      showToast(res.message, 'success');
      loadStudentsForMarks();
    } catch (err) {
      showToast(err.message || 'Failed to save marks', 'error');
    } finally {
      setSavingMarks(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    if (!reportCard) {
      showToast('No transcript data available to download.', 'warning');
      return;
    }
    const student = reportCard.student || {};
    const summary = reportCard.summary || {};
    const subjects = reportCard.subjects || [];

    const headers = ['Subject', 'Max Marks', 'Pass Marks', 'Marks Obtained', 'Grade', 'Result'];
    const rows = subjects.map((s) => [
      `"${s.subject}"`,
      s.max_marks,
      s.pass_marks,
      s.marks_obtained,
      `"${s.grade}"`,
      `"${s.status}"`,
    ]);

    const csvContent = [
      `OFFICIAL ACADEMIC TRANSCRIPT`,
      `Institution,"${reportCard.institution_name || 'EduManage Institute of Technology'}"`,
      `Accreditation,"${reportCard.accreditation || 'Autonomous Institution - Affiliated to State Technological University'}"`,
      `Examination,"${reportCard.examination || 'End-Semester Examination 2026'}"`,
      `Date of Issue,"${reportCard.issued_date || new Date().toISOString().split('T')[0]}"`,
      ``,
      `STUDENT PROFILE`,
      `Student Name,"${student.name || ''}"`,
      `Roll Number,"${student.roll_no || ''}"`,
      `Department,"${student.department || ''}"`,
      `Semester,"Semester ${student.semester || ''}"`,
      ``,
      `COURSE PERFORMANCE`,
      headers.join(','),
      ...rows.map((r) => r.join(',')),
      ``,
      `ACADEMIC SUMMARY`,
      `Total Marks Obtained,"${summary.total_marks_obtained || 0} / ${summary.total_max_marks || 0}"`,
      `Percentage,"${summary.percentage || 0}%"`,
      `Final Grade,"${summary.grade || 'N/A'}"`,
      `Cumulative GPA,"${summary.gpa || 0} / 10.0"`,
      `Attendance Rate,"${summary.attendance_percentage || 0}%"`,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Academic_Transcript_${student.roll_no || 'Record'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Official transcript downloaded successfully!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-7 h-7 text-indigo-600" />
            {isStudent ? 'Official Academic Transcript' : 'Examinations & Academic Report Cards'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isStudent
              ? `Official institutional grade report, subject marks, and semester transcripts for ${currentUser?.name || 'Student'}.`
              : 'Manage exam terms, batch mark entries with 0-100 range enforcement, and issue printable official transcripts.'}
          </p>
        </div>

        {/* Tab Switcher (Report Card removed from Admin & Teacher Portal) */}
        {!isStudent && !isTeacher && (
          <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('exams')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                activeTab === 'exams'
                  ? 'bg-white text-indigo-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Exam Terms & Publishing
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('marks')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                activeTab === 'marks'
                  ? 'bg-white text-indigo-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Batch Marks Entry
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: EXAMS & PUBLISHING */}
      {!isStudent && !isTeacher && activeTab === 'exams' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Exam Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit">
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              Create Examination Term
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Add new formal assessments to the academic calendar.
            </p>
            <form onSubmit={handleCreateExam} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Exam Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. End-Semester Examination 2026"
                  value={newExamTitle}
                  onChange={(e) => setNewExamTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assessment Term
                </label>
                <select
                  value={newExamTerm}
                  onChange={(e) => setNewExamTerm(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Mid-Term">Mid-Term Assessment</option>
                  <option value="End-Term">End-Term Final Examination</option>
                  <option value="Practical">Laboratory & Practical Exam</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition"
              >
                Create Exam
              </button>
            </form>
          </div>

          {/* Exams List */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Registered Examinations ({exams.length})
              </h3>
              <span className="text-xs text-slate-500">
                Publishing controls student report card visibility
              </span>
            </div>

            {loadingExams ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Loading exams...
              </div>
            ) : exams.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No exams recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {exams.map((ex) => (
                  <div
                    key={ex.exam_id || ex.id}
                    className="p-4 flex items-center justify-between hover:bg-slate-50 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {ex.title}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {ex.term}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        ID: {ex.exam_id}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          ex.is_published
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {ex.is_published ? (
                          <>
                            <Eye className="w-3 h-3" /> Published
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" /> Draft (Hidden)
                          </>
                        )}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleTogglePublish(ex.exam_id)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
                      >
                        {ex.is_published ? 'Unpublish' : 'Publish Results'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BATCH MARKS ENTRY */}
      {!isStudent && activeTab === 'marks' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-700">
                  Select Subject:
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                >
                  {availableSubjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub} {isTeacher ? '• (Assigned)' : '(Max: 100, Pass: 40)'}
                    </option>
                  ))}
                </select>
              </div>

              {isTeacher && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Teaching Class:
                  </label>
                  <select
                    value={selectedBatch}
                    onChange={(e) => setSelectedBatch(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  >
                    <option value="ALL">All My Teaching Classes ({teacherAssignedClasses.join(', ')})</option>
                    {teacherAssignedClasses.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls} {cls.includes('CSE') ? '• (Aarav\'s Batch)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSaveBatchMarks}
              disabled={savingMarks}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {savingMarks ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Save Marks for Students</span>
            </button>
          </div>

          {/* Teacher Scoping Banner */}
          {isTeacher && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-xs flex flex-wrap items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  <strong>Authorized Grading Scope:</strong> You are entering marks for <strong>{selectedSubject}</strong> for enrolled students in <strong>{selectedBatch === 'ALL' ? teacherAssignedClasses.join(', ') : selectedBatch}</strong>.
                </span>
              </div>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">
                {studentScores.length} Enrolled Students
              </span>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loadingScores ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Loading students roster...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Roll No</th>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Semester</th>
                      <th className="py-3 px-4 text-center">
                        Marks ({selectedSubject})
                      </th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentScores.map((s) => {
                      const scoreNum = Number(s.score) || 0;
                      const isPassing = scoreNum >= 40;
                      return (
                        <tr key={s.roll_no} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {s.roll_no}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {s.name}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {s.department}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            Sem {s.semester}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={s.score}
                              onChange={(e) =>
                                handleScoreChange(s.roll_no, e.target.value)
                              }
                              className="w-20 px-2.5 py-1 text-center font-mono font-bold text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="py-3 px-4 text-center font-bold">
                            {isPassing ? (
                              <span className="text-emerald-600">Pass</span>
                            ) : (
                              <span className="text-rose-600">Fail</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: OFFICIAL ACADEMIC TRANSCRIPT (Strictly Student Portal Only) */}
      {isStudent && activeTab === 'report' && (
        <div className="space-y-6">
          {/* Student Picker & Download Actions Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 print:hidden">
            {isStudent ? (
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200">
                  Verified Academic Transcript
                </span>
                <span className="text-xs font-mono font-bold text-slate-700">
                  Student Roll No: {reportCard?.student?.roll_no || studentRollNo}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-slate-700">
                  Select Student:
                </label>
                <input
                  type="text"
                  placeholder="e.g. CSE2024001"
                  value={selectedRollNo}
                  onChange={(e) => setSelectedRollNo(e.target.value.toUpperCase())}
                  className="px-3 py-1.5 text-xs font-mono font-bold uppercase bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => loadReportCard(selectedRollNo)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Generate Transcript
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintReport}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download / Print PDF</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadCSV}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Printable Report Card Document */}
          {loadingReport ? (
            <div className="p-16 text-center text-slate-400 text-xs">
              Generating official transcript document...
            </div>
          ) : !reportCard ? (
            <div className="p-16 text-center text-slate-400 text-xs">
              No transcript available. Select a valid student roll number.
            </div>
          ) : (
            <div
              id="printable-report-card"
              className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-lg max-w-4xl mx-auto text-slate-900 font-sans print:border-none print:shadow-none print:p-0"
            >
              {/* Institution Header */}
              <div className="text-center border-b-2 border-slate-900 pb-6 mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-900 text-white flex items-center justify-center">
                    <Award className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                    {reportCard.institution_name}
                  </h2>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  {reportCard.accreditation}
                </p>
                <div className="inline-block mt-3 px-4 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-extrabold tracking-wide uppercase border border-slate-300">
                  {reportCard.examination}
                </div>
              </div>

              {/* Student Metadata Table */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-6">
                <div>
                  <span className="text-slate-500 block text-[11px]">
                    Student Name
                  </span>
                  <strong className="text-slate-900 text-sm">
                    {reportCard.student.name}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">
                    Roll Number
                  </span>
                  <strong className="text-slate-900 text-sm font-mono">
                    {reportCard.student.roll_no}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">
                    Department
                  </span>
                  <strong className="text-slate-900 text-sm">
                    {reportCard.student.department}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">
                    Semester
                  </span>
                  <strong className="text-slate-900 text-sm">
                    Semester {reportCard.student.semester}
                  </strong>
                </div>
              </div>

              {/* Marks Roster */}
              <table className="w-full text-left text-xs border border-slate-300 mb-6 border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold uppercase">
                    <th className="py-2.5 px-3 border-r border-slate-300">
                      Subject
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-300 text-center">
                      Max Marks
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-300 text-center">
                      Pass Marks
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-300 text-center">
                      Marks Obtained
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-300 text-center">
                      Letter Grade
                    </th>
                    <th className="py-2.5 px-3 text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {reportCard.subjects.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold border-r border-slate-200">
                        {s.subject}
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono">
                        {s.max_marks}
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono">
                        {s.pass_marks}
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono font-bold text-sm">
                        {s.marks_obtained}
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-200 font-bold">
                        {s.grade}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-700">
                        {s.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Performance Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900 text-white text-center mb-8">
                <div>
                  <span className="text-slate-400 text-[11px] block">
                    Total Marks
                  </span>
                  <div className="text-xl font-bold font-mono">
                    {reportCard.summary.total_marks_obtained} /{' '}
                    {reportCard.summary.total_max_marks}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">
                    Percentage
                  </span>
                  <div className="text-xl font-bold font-mono text-indigo-300">
                    {reportCard.summary.percentage}%
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">
                    Final Grade & GPA
                  </span>
                  <div className="text-xl font-bold text-amber-300">
                    {reportCard.summary.grade} ({reportCard.summary.gpa}/10.0)
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">
                    Attendance Rate
                  </span>
                  <div className="text-xl font-bold text-emerald-400">
                    {reportCard.summary.attendance_percentage}%
                  </div>
                </div>
              </div>

              {/* Signatures & Footer Stamp */}
              <div className="pt-8 border-t border-slate-200 flex items-end justify-between text-xs text-slate-500">
                <div>
                  <span className="block font-semibold text-slate-700">
                    Date of Issue: {reportCard.issued_date}
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    System Generated Academic Transcript
                  </span>
                </div>
                <div className="text-center">
                  <div className="w-36 border-b border-slate-900 mb-1" />
                  <span className="font-bold text-slate-800">
                    Controller of Examinations
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
