import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  Award,
  CalendarCheck,
  Calendar,
  CreditCard,
  Bell,
  Printer,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  User,
  Clock,
  Receipt,
  Download,
  FileSpreadsheet,
  ShieldCheck,
  DollarSign,
  X,
  Plus,
} from 'lucide-react';
import { apiService } from '../services/api';

export default function StudentPortal({ currentUser, showToast }) {
  const [activeTab, setActiveTab] = useState('results'); // 'results' | 'attendance' | 'timetable' | 'fees' | 'notices'

  const rollNo =
    currentUser?.associated_id ||
    currentUser?.student_profile?.roll_no ||
    'CSE2024001';

  const [student, setStudent] = useState(currentUser?.student_profile || null);
  const [reportCard, setReportCard] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [timetable, setTimetable] = useState([]);
  const [fees, setFees] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Student Fee payment & receipt modal
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [paying, setPaying] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState(null);

  const loadStudentData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Load Student details & Report Card
      const [cardRes, attRes, annRes] = await Promise.all([
        apiService.getReportCard(rollNo).catch(() => null),
        apiService.getStudentAttendance(rollNo).catch(() => null),
        apiService.getAnnouncements('students').catch(() => null),
      ]);

      if (cardRes?.report_card) {
        setReportCard(cardRes.report_card);
        setStudent(cardRes.report_card.student);
      }
      if (attRes) {
        setAttendance(attRes);
      }
      if (annRes?.announcements) {
        setAnnouncements(annRes.announcements);
      }

      // 2. Load timetable for student's enrolled subjects
      const dept =
        cardRes?.report_card?.student?.department ||
        student?.department ||
        currentUser?.department ||
        'CSE';
      const sem =
        cardRes?.report_card?.student?.semester ||
        student?.semester ||
        currentUser?.semester ||
        4;
      const enrolled =
        currentUser?.enrolled_subjects ||
        student?.enrolled_subjects ||
        (cardRes?.report_card?.subjects
          ? cardRes.report_card.subjects.map((s) => s.subject)
          : ['DBMS', 'DSA', 'Python']);

      const ttRes = await apiService
        .getTimetable({
          department: dept,
          semester: sem,
          student: rollNo,
          subjects: enrolled.join(','),
          scope: 'my',
        })
        .catch(() => null);
      if (ttRes?.timetable) {
        setTimetable(ttRes.timetable);
      }

      // 3. Load Fee status
      const feeRes = await apiService
        .getFees({ search: rollNo })
        .catch(() => null);
      if (feeRes?.fees && feeRes.fees.length > 0) {
        setFees(feeRes.fees[0]);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load student dashboard', 'error');
    } finally {
      setLoading(false);
    }
  }, [rollNo, showToast]);

  useEffect(() => {
    loadStudentData();
  }, [loadStudentData]);

  const handlePrint = () => {
    window.print();
  };

  const handleStudentPayment = async (e) => {
    e.preventDefault();
    const amt = Number(payAmount);
    if (!amt || amt <= 0) {
      showToast('Please enter a valid positive payment amount.', 'warning');
      return;
    }
    setPaying(true);
    try {
      const res = await apiService.recordPayment({
        roll_no: rollNo,
        amount: amt,
      });
      showToast(res.message || 'Fee payment recorded successfully!', 'success');
      setIsPaymentOpen(false);
      setPayAmount('');
      loadStudentData();
    } catch (err) {
      showToast(err.message || 'Failed to record payment', 'error');
    } finally {
      setPaying(false);
    }
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
      `Student Name,"${student.name || currentUser?.name || ''}"`,
      `Roll Number,"${student.roll_no || rollNo || ''}"`,
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
    link.setAttribute('download', `Academic_Transcript_${student.roll_no || rollNo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Official transcript downloaded successfully!', 'success');
  };

  const handleDownloadAttendanceCSV = () => {
    if (!attendance) {
      showToast('No attendance records available to export.', 'warning');
      return;
    }
    const history = attendance.history || [];
    const subjects = attendance.subjects_breakdown || [];

    const headers = ['Date', 'Day', 'Time Slot', 'Subject', 'Teacher', 'Status', 'Topic / Remarks'];
    const rows = history.map((h) => [
      `"${h.date}"`,
      `"${h.day || ''}"`,
      `"${h.time_slot || '09:00 - 10:00'}"`,
      `"${h.subject}"`,
      `"${h.teacher || 'Faculty'}"`,
      `"${h.status}"`,
      `"${(h.remark || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [
      `OFFICIAL STUDENT ATTENDANCE REPORT`,
      `Student Name,"${currentUser?.name || student?.name || ''}"`,
      `Roll Number,"${rollNo}"`,
      `Department,"${student?.department || ''}"`,
      `Semester,"Semester ${student?.semester || 4}"`,
      `Report Generated,"${new Date().toISOString().split('T')[0]}"`,
      ``,
      `OVERALL ATTENDANCE SUMMARY`,
      `Overall Percentage,"${attendance.attendance_percentage}%"`,
      `Total Sessions,"${attendance.total_sessions}"`,
      `Sessions Attended,"${attendance.attended_sessions}"`,
      `Sessions Absent,"${attendance.absent_sessions || 0}"`,
      `Late Arrivals,"${attendance.late_sessions || 0}"`,
      `Eligibility Status,"${attendance.is_low ? 'Shortage (<75%)' : 'Eligible for Examinations'}"`,
      ``,
      `SUBJECT-WISE BREAKDOWN`,
      `Subject,Faculty,Total Sessions,Attended,Absent,Percentage,Status`,
      ...subjects.map(
        (s) =>
          `"${s.subject}","${s.teacher || 'Faculty'}",${s.total_sessions},${s.attended_sessions},${s.absent_sessions || 0},"${s.attendance_percentage}%","${s.status}"`
      ),
      ``,
      `DATE-WISE SESSION LOGS`,
      headers.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Attendance_Report_${rollNo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Personal attendance records downloaded as CSV!', 'success');
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span>Loading your student dashboard...</span>
      </div>
    );
  }

  const attPct = attendance?.attendance_percentage ?? 88.5;
  const isShortage = attPct < 75.0;

  return (
    <div className="space-y-6">
      {/* Student Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center font-bold text-xl text-indigo-300 shadow-inner">
              {currentUser?.name?.slice(0, 2).toUpperCase() || 'ST'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight">
                  {currentUser?.name || student?.name || 'Student Portal'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                  Enrolled & Active
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-1 font-mono">
                Roll No: <strong>{rollNo}</strong> • Department:{' '}
                <strong>{student?.department || 'CSE'}</strong> • Semester:{' '}
                <strong>{student?.semester || 4}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2"
            >
              <Printer className="w-4 h-4 text-indigo-600" />
              <span>Print Official Transcript</span>
            </button>
          </div>
        </div>

        {/* Shortage Alert Banner if attendance < 75% */}
        {isShortage && (
          <div className="mt-4 p-3 bg-rose-500/20 border border-rose-400/40 rounded-xl text-rose-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />
            <span>
              <strong>Attendance Warning:</strong> Your current attendance is{' '}
              {attPct}%, which is below the mandatory 75% institutional threshold.
              Please contact your department advisor.
            </span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 block mb-1">
            Academic Average
          </span>
          <div className="text-2xl font-black text-indigo-600 font-mono">
            {reportCard?.summary?.percentage ?? 88.0}%
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Across DBMS, DSA & Python
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 block mb-1">
            Letter Grade & Standing
          </span>
          <div className="text-2xl font-black text-emerald-600">
            Grade {reportCard?.summary?.grade ?? 'A'}
          </div>
          <span className="text-[11px] text-emerald-500 mt-0.5 block">
            {reportCard?.summary?.result ?? 'PASSED'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 block mb-1">
            Cumulative GPA (10.0)
          </span>
          <div className="text-2xl font-black text-amber-500 font-mono">
            {reportCard?.summary?.gpa ?? 8.8} / 10.0
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Academic Performance Index
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 block mb-1">
            Attendance Rate
          </span>
          <div
            className={`text-2xl font-black font-mono ${
              isShortage ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {attPct}%
          </div>
          <span
            className={`text-[11px] font-medium mt-0.5 block ${
              isShortage ? 'text-rose-500' : 'text-emerald-600'
            }`}
          >
            {isShortage ? 'Shortage Warning (<75%)' : 'Eligible for Exams'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('results')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === 'results'
              ? 'bg-white text-indigo-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          My Academic Results
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === 'attendance'
              ? 'bg-white text-indigo-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          My Attendance
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('timetable')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === 'timetable'
              ? 'bg-white text-indigo-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Class Timetable
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('fees')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === 'fees'
              ? 'bg-white text-indigo-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          My Fee Status
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('notices')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === 'notices'
              ? 'bg-white text-indigo-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Notices ({announcements.length})
        </button>
      </div>

      {/* TAB 1: ACADEMIC RESULTS */}
      {activeTab === 'results' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Official Academic Transcript & Results
              </h2>
              <p className="text-xs text-slate-500">
                End-Semester Examination 2026 • Verified Institutional Document
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                Published & Certified
              </span>
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download / Print PDF</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadCSV}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <table className="w-full text-left text-xs border border-slate-200 border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase">
                <th className="py-3 px-4 border-r border-slate-200">Subject</th>
                <th className="py-3 px-4 border-r border-slate-200 text-center">
                  Max Marks
                </th>
                <th className="py-3 px-4 border-r border-slate-200 text-center">
                  Passing Marks
                </th>
                <th className="py-3 px-4 border-r border-slate-200 text-center">
                  Marks Obtained
                </th>
                <th className="py-3 px-4 border-r border-slate-200 text-center">
                  Grade
                </th>
                <th className="py-3 px-4 text-center">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(reportCard?.subjects || []).map((s, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900 border-r border-slate-100">
                    {s.subject}
                  </td>
                  <td className="py-3 px-4 text-center font-mono border-r border-slate-100 text-slate-500">
                    {s.max_marks}
                  </td>
                  <td className="py-3 px-4 text-center font-mono border-r border-slate-100 text-slate-500">
                    {s.pass_marks}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-sm text-indigo-600 border-r border-slate-100">
                    {s.marks_obtained}
                  </td>
                  <td className="py-3 px-4 text-center font-bold border-r border-slate-100">
                    {s.grade}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600">
                    {s.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Grading Legend */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-4">
            <span>
              <strong>Grading Scale:</strong> Grade A (≥80%) • Grade B (70–79%) •
              Grade C (60–69%) • Grade D (40–59%) • Grade F (&lt;40%)
            </span>
            <span className="font-semibold text-slate-700">
              Passing Standard: 40% per subject
            </span>
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE HISTORY */}
      {activeTab === 'attendance' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Personal Attendance Records & Logs
              </h2>
              <p className="text-xs text-slate-500">
                Sessions Attended: <strong>{attendance?.attended_sessions || 0}</strong> of{' '}
                <strong>{attendance?.total_sessions || 0}</strong> total class sessions held
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${isShortage ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                {attPct}% {isShortage ? '(Shortage)' : '(Eligible)'}
              </span>
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print PDF</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadAttendanceCSV}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Subject-Wise Attendance Breakdown */}
          {attendance?.subjects_breakdown && attendance.subjects_breakdown.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Subject-Wise Breakdown</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {attendance.subjects_breakdown.map((s, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">{s.subject}</span>
                      <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${s.is_low ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {s.attendance_percentage}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${s.is_low ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(s.attendance_percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{s.attended_sessions} / {s.total_sessions} attended</span>
                      <span>{s.teacher || 'Faculty'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Date-Wise Session Logs Table */}
          {(!attendance?.history || attendance.history.length === 0) ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No individual session logs recorded yet. Overall baseline is active.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase">
                    <th className="py-2.5 px-3 border-r border-slate-200">Date & Day</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Time</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Subject</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Instructor</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">Status</th>
                    <th className="py-2.5 px-3">Topic / Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendance.history.map((h, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono text-slate-700 border-r border-slate-100 whitespace-nowrap">
                        {h.date} {h.day ? `(${h.day})` : ''}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 border-r border-slate-100 whitespace-nowrap">
                        {h.time_slot || '09:00 - 10:00'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 border-r border-slate-100">
                        {h.subject}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">
                        {h.teacher || 'Faculty'}
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-100">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            h.status === 'Present'
                              ? 'bg-emerald-100 text-emerald-800'
                              : h.status === 'Late'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {h.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {h.remark || 'Regular lecture class session'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TIMETABLE */}
      {activeTab === 'timetable' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Weekly Class Schedule ({student?.department || 'CSE'} Sem {student?.semester || 4})
              </h2>
              <p className="text-xs text-slate-500">
                Showing lectures for your enrolled subjects only.
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg border border-indigo-200">
              Enrolled Schedule
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(
              (day) => {
                const daySlots = timetable.filter((s) => s.day === day);
                return (
                  <div
                    key={day}
                    className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50"
                  >
                    <div className="bg-indigo-900 text-white p-2 text-center text-xs font-bold uppercase">
                      {day}
                    </div>
                    <div className="p-2 space-y-2">
                      {daySlots.length === 0 ? (
                        <div className="py-6 text-center text-slate-400 text-[10px]">
                          No class
                        </div>
                      ) : (
                        daySlots.map((s, idx) => (
                          <div
                            key={idx}
                            className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs shadow-xs"
                          >
                            <span className="font-mono text-[10px] text-indigo-600 font-bold block mb-0.5">
                              {s.time_slot}
                            </span>
                            <div className="flex items-center justify-between gap-1">
                              <strong className="text-slate-900 block">
                                {s.subject}
                              </strong>
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1 py-0.2 rounded">
                                Enrolled
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 block">
                              {s.teacher}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {s.room}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* TAB 4: FEES */}
      {activeTab === 'fees' && (() => {
        const studentTotal = Number(fees?.total_amount || 45000);
        const studentPaid = Number(fees?.paid_amount || 0);
        const studentBalance = Number(fees?.balance || Math.max(0, studentTotal - studentPaid));
        const isStudentPaid = studentBalance === 0 || fees?.status === 'Paid';

        const feeComponents = [
          {
            title: 'Tuition & Academic Instruction Fee',
            description: 'Faculty lectures, classroom infrastructure, curriculum & laboratory access',
            amount: Math.round(studentTotal * 0.72),
            status: studentPaid >= Math.round(studentTotal * 0.72) ? 'Settled' : 'Partially Settled',
          },
          {
            title: 'Computing Lab & Hardware Practical Fee',
            description: 'High-performance computing workstations, cloud VMs & tool licenses',
            amount: Math.round(studentTotal * 0.14),
            status: studentPaid >= Math.round(studentTotal * 0.86) ? 'Settled' : (studentPaid > Math.round(studentTotal * 0.72) ? 'Partially Settled' : 'Pending'),
          },
          {
            title: 'Digital Library & Research Database Access',
            description: 'IEEE Xplore, ACM Digital Library, Springer journals & book access',
            amount: Math.round(studentTotal * 0.08),
            status: studentPaid >= Math.round(studentTotal * 0.94) ? 'Settled' : 'Pending',
          },
          {
            title: 'End-Semester Examination & Evaluation Fee',
            description: 'Autonomous exam cell registration, answer scripts & grade cards',
            amount: Math.round(studentTotal * 0.06),
            status: studentPaid >= studentTotal ? 'Settled' : 'Pending',
          },
        ];

        return (
          <div className="space-y-6">
            {/* Top Sub-Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Tuition Fee Clearance & Academic Ledger
                </h2>
                <p className="text-xs text-slate-500">
                  Semester {student?.semester || 4} fee dues breakdown, receipt voucher, and exam clearance status.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveReceipt(fees || {
                    roll_no: rollNo,
                    name: student?.name || currentUser?.name || 'Student',
                    department: student?.department || 'CSE',
                    semester: student?.semester || 4,
                    total_amount: studentTotal,
                    paid_amount: studentPaid,
                    balance: studentBalance,
                    status: isStudentPaid ? 'Paid' : 'Partial',
                    receipt_no: fees?.receipt_no || `REC-${rollNo}`,
                  })}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Download Clearance Voucher</span>
                </button>
                {studentBalance > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setPayAmount(String(studentBalance));
                      setIsPaymentOpen(true);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Pay Dues Now</span>
                  </button>
                )}
              </div>
            </div>

            {/* Clearance Banner */}
            {isStudentPaid ? (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <strong className="text-sm font-bold block text-emerald-800">
                      Official Fee Clearance Approved
                    </strong>
                    <span className="text-emerald-700">
                      All tuition, lab, and examination dues have been settled. Your exam hall ticket and grade transcript clearance are active.
                    </span>
                  </div>
                </div>
                <div className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-xl text-xs shrink-0 self-start sm:self-auto flex items-center gap-1.5 shadow-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Cleared for Exams</span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                  <div>
                    <strong className="text-sm font-bold block text-amber-800">
                      Fee Clearance Pending — Outstanding Balance: ₹{studentBalance.toLocaleString()}
                    </strong>
                    <span className="text-amber-700">
                      An installment of ₹{studentBalance.toLocaleString()} is remaining for Semester {student?.semester || 4}. Settle before examination commencement.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPayAmount(String(studentBalance));
                    setIsPaymentOpen(true);
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shrink-0 self-start sm:self-auto flex items-center gap-1.5 shadow-xs"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Settle Balance (₹{studentBalance.toLocaleString()})</span>
                </button>
              </div>
            )}

            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 text-xs block mb-1">Total Semester Tuition</span>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  ₹{studentTotal.toLocaleString()}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">Invoiced Term Amount</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 text-xs block mb-1">Total Paid to Date</span>
                <div className="text-2xl font-black text-emerald-600 font-mono">
                  ₹{studentPaid.toLocaleString()}
                </div>
                <span className="text-[11px] text-emerald-600 font-semibold mt-1 block flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Bank Settled
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 text-xs block mb-1">Outstanding Balance</span>
                <div className={`text-2xl font-black font-mono ${studentBalance === 0 ? 'text-slate-400' : 'text-rose-600'}`}>
                  ₹{studentBalance.toLocaleString()}
                </div>
                <span className={`text-[11px] font-semibold mt-1 block ${studentBalance === 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {studentBalance === 0 ? 'Zero Balance Pending' : 'Due Before Exams'}
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 text-xs block mb-1">Exam Clearance Status</span>
                <div className="text-2xl font-black font-mono">
                  <span className={`inline-flex items-center gap-1 text-lg font-bold ${isStudentPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {isStudentPaid ? 'CLEARED' : 'PENDING'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {isStudentPaid ? 'Admit Card Granted' : 'Provisional Clearance'}
                </span>
              </div>
            </div>

            {/* Detailed Itemized Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Itemized Semester Fee Structure & Clearance Breakdown
                  </h3>
                  <p className="text-xs text-slate-500">
                    Distribution of institutional tuition and laboratory components for Semester {student?.semester || 4}.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                  Receipt: {fees?.receipt_no || `REC-${rollNo}`}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold uppercase">
                      <th className="py-3 px-4">Fee Component</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-right">Invoiced Amount</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {feeComponents.map((comp, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {comp.title}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {comp.description}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                          ₹{comp.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                              comp.status === 'Settled'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : comp.status === 'Partially Settled'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {comp.status === 'Settled' && <CheckCircle2 className="w-3 h-3" />}
                            {comp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold border-t border-slate-200">
                      <td colSpan={2} className="py-3 px-4 text-slate-900 text-right">
                        Total Account Balance:
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-900 text-sm">
                        ₹{studentTotal.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[11px] text-emerald-700 font-mono font-bold">
                          Paid: ₹{studentPaid.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 5: NOTICES */}
      {activeTab === 'notices' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            Student Circulars & Bulletins
          </h2>
          <div className="space-y-3">
            {announcements.map((a) => (
              <div
                key={a.id || a._id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                    {a.category}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {a.created_at
                      ? new Date(a.created_at).toLocaleDateString()
                      : 'Recent'}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">
                  {a.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {a.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student Online Payment Modal */}
      {isPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 relative">
            <button
              onClick={() => setIsPaymentOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              Clear Outstanding Semester Dues
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Submit an online payment to settle pending academic tuition dues for {rollNo}.
            </p>

            <form onSubmit={handleStudentPayment} className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student Name:</span>
                  <strong className="text-slate-900">{student?.name || currentUser?.name || 'Student'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Roll Number:</span>
                  <strong className="font-mono text-slate-900">{rollNo}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Balance:</span>
                  <strong className="font-mono text-rose-600">
                    ₹{Number(fees?.balance || 0).toLocaleString()}
                  </strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="e.g. 20000"
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setPayAmount(String(fees?.balance || 20000))}
                  className="text-[11px] text-indigo-600 hover:text-indigo-700 font-bold mt-1.5 inline-block cursor-pointer"
                >
                  Fill Full Outstanding Balance (₹{Number(fees?.balance || 0).toLocaleString()})
                </button>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paying}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {paying ? 'Processing Payment...' : 'Confirm & Settle Dues'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Receipt Voucher Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 relative">
            <button
              onClick={() => setActiveReceipt(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700 print:hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Receipt Content */}
            <div className="text-center pb-4 border-b border-slate-200 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base uppercase tracking-tight">
                EduManage Institute of Technology
              </h3>
              <p className="text-[11px] text-slate-500">
                Official Student Fee Clearance Certificate & Receipt
              </p>
              <div className="inline-block mt-2 px-3 py-0.5 rounded-full bg-slate-100 font-mono text-[11px] text-slate-700 font-bold">
                {activeReceipt.receipt_no || `REC-${rollNo}`}
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 mb-6">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Student Name:</span>
                <strong className="text-slate-900">{student?.name || currentUser?.name || 'Student'}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Roll Number:</span>
                <strong className="font-mono text-slate-900">{rollNo}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Class & Semester:</span>
                <span>{student?.department || 'CSE'} Sem {student?.semester || 4}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Total Invoiced:</span>
                <span className="font-mono">₹{Number(activeReceipt.total_amount || 45000).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700 font-bold">
                <span>Amount Paid:</span>
                <span className="font-mono">₹{Number(activeReceipt.paid_amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 text-rose-700 font-bold">
                <span>Remaining Balance:</span>
                <span className="font-mono">₹{Number(activeReceipt.balance || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Clearance Status:</span>
                <strong className={Number(activeReceipt.balance || 0) === 0 ? 'text-emerald-600' : 'text-amber-600'}>
                  {Number(activeReceipt.balance || 0) === 0 ? 'CLEARED & APPROVED' : 'PENDING'}
                </strong>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Certificate</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
