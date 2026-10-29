import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  Award,
  AlertTriangle,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { apiService } from '../services/api';

export default function Reports({ showToast }) {
  const [reportType, setReportType] = useState('merit'); // 'merit' | 'attendance' | 'directory'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      try {
        if (reportType === 'merit') {
          const res = await apiService.getTopStudents(20);
          setData(res.data || []);
        } else if (reportType === 'attendance') {
          const res = await apiService.getAttendanceSummary();
          const shortages = (res.records || []).filter(
            (r) => r.is_low_attendance
          );
          setData(shortages);
        } else if (reportType === 'directory') {
          const res = await apiService.getStudents({ limit: 100 });
          setData(res.students || []);
        }
      } catch (err) {
        showToast(err.message || 'Failed to generate report', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [reportType, showToast]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    window.open('/api/students/export/csv', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600" />
            Institutional Reports & Audit Extracts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate formal academic transcripts, merit rosters, and regulatory attendance audit files.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>Download CSV Data</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit print:hidden">
        <button
          type="button"
          onClick={() => setReportType('merit')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
            reportType === 'merit'
              ? 'bg-white text-indigo-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Academic Merit Roster
        </button>
        <button
          type="button"
          onClick={() => setReportType('attendance')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
            reportType === 'attendance'
              ? 'bg-white text-indigo-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Attendance Shortage Audit (&lt;75%)
        </button>
        <button
          type="button"
          onClick={() => setReportType('directory')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
            reportType === 'directory'
              ? 'bg-white text-indigo-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Institutional Student Directory
        </button>
      </div>

      {/* Printable Report Sheet */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-md">
        <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center">
          <h2 className="text-xl font-black text-slate-900 uppercase">
            EduManage Institute of Technology & Engineering
          </h2>
          <p className="text-xs text-slate-600">
            {reportType === 'merit' && 'Official Academic Performance & Merit Order List'}
            {reportType === 'attendance' && 'Regulatory Attendance Shortage Report (<75%)'}
            {reportType === 'directory' && 'Complete Student Master Enrollment Directory'}
          </p>
          <span className="text-[10px] text-slate-400 block mt-1">
            Generated: {new Date().toLocaleString()}
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs">
            Compiling report from database records...
          </div>
        ) : data.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs">
            No records found for this report.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold uppercase border-b border-slate-300">
                  <th className="py-2.5 px-3 border-r border-slate-300">#</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Roll No</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Full Name</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Dept & Sem</th>
                  {reportType === 'merit' && (
                    <>
                      <th className="py-2.5 px-3 border-r border-slate-300 text-center">Average Marks</th>
                      <th className="py-2.5 px-3 text-center">Grade</th>
                    </>
                  )}
                  {reportType === 'attendance' && (
                    <>
                      <th className="py-2.5 px-3 border-r border-slate-300 text-center">Sessions Held</th>
                      <th className="py-2.5 px-3 border-r border-slate-300 text-center">Attended</th>
                      <th className="py-2.5 px-3 text-center">Attendance %</th>
                    </>
                  )}
                  {reportType === 'directory' && (
                    <>
                      <th className="py-2.5 px-3 border-r border-slate-300">Email Address</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.map((item, idx) => (
                  <tr key={item.roll_no || idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 border-r border-slate-200 font-mono text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-slate-900">
                      {item.roll_no}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-800">
                      {item.name}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-600">
                      {item.department} Sem {item.semester}
                    </td>

                    {reportType === 'merit' && (
                      <>
                        <td className="py-2 px-3 border-r border-slate-200 text-center font-mono font-bold text-indigo-600">
                          {item.average_marks}%
                        </td>
                        <td className="py-2 px-3 text-center font-bold">
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                            Grade {item.grade}
                          </span>
                        </td>
                      </>
                    )}

                    {reportType === 'attendance' && (
                      <>
                        <td className="py-2 px-3 border-r border-slate-200 text-center font-mono">
                          {item.total_sessions}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-center font-mono font-bold">
                          {item.attended_sessions}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-rose-600">
                          {item.attendance_percentage}%
                        </td>
                      </>
                    )}

                    {reportType === 'directory' && (
                      <>
                        <td className="py-2 px-3 border-r border-slate-200 text-slate-600">
                          {item.email}
                        </td>
                        <td className="py-2 px-3 text-center font-semibold text-emerald-700">
                          {item.status || 'Active'}
                        </td>
                      </>
                    )}
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
