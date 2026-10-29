import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Receipt,
  Printer,
  X,
  Plus,
  Filter,
  ShieldCheck,
  Download,
  DollarSign,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { apiService } from '../services/api';

export default function Fees({ showToast, userRole = 'admin', currentUser }) {
  const isStudent = userRole === 'student';

  const studentRollNo =
    currentUser?.associated_id ||
    currentUser?.roll_no ||
    currentUser?.student_profile?.roll_no ||
    'CSE2024001';
  const studentName =
    currentUser?.name || currentUser?.student_profile?.name || 'Student';
  const studentDept =
    currentUser?.department || currentUser?.student_profile?.department || 'CSE';
  const studentSem =
    currentUser?.semester || currentUser?.student_profile?.semester || 4;

  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Payment modal state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [payData, setPayData] = useState({
    roll_no: isStudent ? studentRollNo : '',
    amount: '',
  });
  const [recording, setRecording] = useState(false);

  // Receipt voucher modal
  const [activeReceipt, setActiveReceipt] = useState(null);

  const loadFees = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (isStudent) {
        params.roll_no = studentRollNo;
        params.search = studentRollNo;
      } else {
        if (search) params.search = search;
        if (statusFilter) params.status = statusFilter;
      }

      const res = await apiService.getFees(params);
      setFees(res.fees || []);
    } catch (err) {
      showToast(err.message || 'Failed to load fee records', 'error');
    } finally {
      setLoading(false);
    }
  }, [isStudent, studentRollNo, search, statusFilter, showToast]);

  useEffect(() => {
    loadFees();
  }, [loadFees]);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const rNo = (isStudent ? studentRollNo : payData.roll_no).trim().toUpperCase();
    const amt = Number(payData.amount);

    if (!rNo || amt <= 0) {
      showToast('Please enter a valid positive payment amount.', 'warning');
      return;
    }

    setRecording(true);
    try {
      const res = await apiService.recordPayment({
        roll_no: rNo,
        amount: amt,
      });
      showToast(res.message || 'Payment recorded successfully!', 'success');
      setIsPaymentOpen(false);
      setPayData({ roll_no: isStudent ? studentRollNo : '', amount: '' });
      loadFees();
    } catch (err) {
      showToast(err.message || 'Failed to record payment', 'error');
    } finally {
      setRecording(false);
    }
  };

  // Student specific record resolution
  const studentFeeRecord =
    fees.find((f) => (f.roll_no || '').toUpperCase() === studentRollNo.toUpperCase()) ||
    fees[0] || {
      roll_no: studentRollNo,
      name: studentName,
      department: studentDept,
      semester: studentSem,
      total_amount: 45000,
      paid_amount: 45000,
      balance: 0,
      status: 'Paid',
      receipt_no: `REC-${studentRollNo}`,
    };

  const studentTotal = Number(studentFeeRecord.total_amount || 45000);
  const studentPaid = Number(studentFeeRecord.paid_amount || 0);
  const studentBalance = Number(studentFeeRecord.balance || Math.max(0, studentTotal - studentPaid));
  const isStudentPaid = studentBalance === 0 || studentFeeRecord.status === 'Paid';

  // Fee component allocations for student breakdown
  const feeComponents = [
    {
      title: 'Tuition & Academic Instruction Fee',
      description: 'Lectures, faculty mentorship, classroom infrastructure & lab access',
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

  // Admin calculations for summary metrics
  const totalBilled = fees.reduce((acc, f) => acc + (f.total_amount || 0), 0);
  const totalCollected = fees.reduce((acc, f) => acc + (f.paid_amount || 0), 0);
  const totalOutstanding = fees.reduce((acc, f) => acc + (f.balance || 0), 0);
  const fullyPaidCount = fees.filter((f) => f.status === 'Paid').length;

  // Render Student-Specific Personal Fee Clearance View
  if (isStudent) {
    return (
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-7 h-7 text-indigo-600" />
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                My Fee Clearance & Account Ledger
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-200">
                Student Portal
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Personal tuition fee dues, verified bank receipts, and semester examination clearance certificate.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveReceipt(studentFeeRecord)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Download Fee Clearance Receipt</span>
            </button>
            {studentBalance > 0 && (
              <button
                type="button"
                onClick={() => {
                  setPayData({ roll_no: studentRollNo, amount: String(studentBalance) });
                  setIsPaymentOpen(true);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Pay Outstanding Dues</span>
              </button>
            )}
          </div>
        </div>

        {/* Student Identification Banner */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center font-bold text-indigo-300">
              {studentName.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{studentName}</span>
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-mono tracking-wider text-slate-200">
                  {studentRollNo}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Department of {studentDept} • Semester {studentSem} • Academic Year 2025–2026
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Receipt Number</span>
              <span className="text-xs font-mono font-bold text-indigo-300">
                {studentFeeRecord.receipt_no || `REC-${studentRollNo}`}
              </span>
            </div>
            <div className="text-right pl-3 border-l border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Clearance Status</span>
              <span className={`text-xs font-bold ${isStudentPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isStudentPaid ? 'Active & Cleared' : 'Pending Dues'}
              </span>
            </div>
          </div>
        </div>

        {/* Clearance Approval / Shortage Banner */}
        {isStudentPaid ? (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <strong className="text-sm font-bold block text-emerald-800">
                  Fee Clearance Approved for End-Semester Examinations
                </strong>
                <span className="text-emerald-700">
                  All semester tuition, laboratory, and library dues have been fully cleared. Your student profile holds a clean financial standing with zero outstanding balance.
                </span>
              </div>
            </div>
            <div className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-xl text-xs shrink-0 self-start sm:self-auto flex items-center gap-1.5 shadow-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Hall Ticket Eligible</span>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <strong className="text-sm font-bold block text-amber-800">
                  Fee Clearance Pending — Outstanding Balance: ₹{studentBalance.toLocaleString()}
                </strong>
                <span className="text-amber-700">
                  A remaining tuition installment of ₹{studentBalance.toLocaleString()} is due for Semester {studentSem}. Please settle the balance before end-semester exam dates to secure your exam admit card.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setPayData({ roll_no: studentRollNo, amount: String(studentBalance) });
                setIsPaymentOpen(true);
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shrink-0 self-start sm:self-auto flex items-center gap-1.5 shadow-xs"
            >
              <DollarSign className="w-4 h-4" />
              <span>Clear Dues (₹{studentBalance.toLocaleString()})</span>
            </button>
          </div>
        )}

        {/* 4 Personal Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-slate-500 text-xs block mb-1">Total Semester Tuition</span>
            <div className="text-2xl font-black text-slate-900 font-mono">
              ₹{studentTotal.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Official Invoiced Dues
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-slate-500 text-xs block mb-1">Total Paid to Date</span>
            <div className="text-2xl font-black text-emerald-600 font-mono">
              ₹{studentPaid.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Verified Bank Credit
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-slate-500 text-xs block mb-1">Outstanding Balance</span>
            <div className={`text-2xl font-black font-mono ${studentBalance === 0 ? 'text-slate-400' : 'text-rose-600'}`}>
              ₹{studentBalance.toLocaleString()}
            </div>
            <span className={`text-[11px] font-semibold mt-1 block ${studentBalance === 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
              {studentBalance === 0 ? 'Zero Balance Pending' : 'Due Before Examination'}
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-slate-500 text-xs block mb-1">Exam Clearance Status</span>
            <div className="text-2xl font-black font-mono">
              <span className={`inline-flex items-center gap-1 text-lg font-bold ${isStudentPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isStudentPaid ? 'CLEARED' : 'PENDING'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {isStudentPaid ? 'Hall Ticket Granted' : 'Provisional Admission'}
            </span>
          </div>
        </div>

        {/* Detailed Itemized Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Itemized Semester Fee Structure & Clearance Breakdown
              </h2>
              <p className="text-xs text-slate-500">
                Institutional distribution of academic and lab components for Semester {studentSem}.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
              Billed: ₹{studentTotal.toLocaleString()}
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
                Make an online fee payment to clear your pending tuition dues for {studentRollNo}.
              </p>

              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Student Name:</span>
                    <strong className="text-slate-900">{studentName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Roll Number:</span>
                    <strong className="font-mono text-slate-900">{studentRollNo}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current Outstanding:</span>
                    <strong className="font-mono text-rose-600">₹{studentBalance.toLocaleString()}</strong>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Amount to Settle (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={studentBalance > 0 ? studentBalance : studentTotal}
                    value={payData.amount}
                    onChange={(e) =>
                      setPayData({ ...payData, amount: e.target.value })
                    }
                    placeholder={`e.g. ${studentBalance || 20000}`}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setPayData({ ...payData, amount: String(studentBalance) })}
                      className="text-[11px] text-indigo-600 hover:text-indigo-700 font-bold cursor-pointer"
                    >
                      Fill Full Balance (₹{studentBalance.toLocaleString()})
                    </button>
                  </div>
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
                    disabled={recording}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {recording ? 'Processing Online Payment...' : 'Confirm & Settle Dues'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Receipt Voucher Modal */}
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
                  {activeReceipt.receipt_no || `REC-${studentRollNo}`}
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700 mb-6">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Student Name:</span>
                  <strong className="text-slate-900">{studentName}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Roll Number:</span>
                  <strong className="font-mono text-slate-900">
                    {studentRollNo}
                  </strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Department & Semester:</span>
                  <span>
                    {studentDept} Sem {studentSem}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Total Semester Tuition:</span>
                  <span className="font-mono">
                    ₹{(activeReceipt.total_amount || 45000).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700 font-bold">
                  <span>Amount Credited:</span>
                  <span className="font-mono">
                    ₹{(activeReceipt.paid_amount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 text-rose-700 font-bold">
                  <span>Pending Balance:</span>
                  <span className="font-mono">
                    ₹{(activeReceipt.balance || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Clearance Status:</span>
                  <strong className={isStudentPaid ? 'text-emerald-600' : 'text-amber-600'}>
                    {isStudentPaid ? 'CLEARED & APPROVED' : 'PARTIAL / PENDING'}
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

  // Admin / Faculty Management View
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-indigo-600" />
            Tuition & Academic Fees Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track student fee balances, log installments, and generate verified fee receipts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsPaymentOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record Fee Payment</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-slate-500 text-xs block mb-1">Total Receivables</span>
          <div className="text-xl font-bold text-slate-900 font-mono">
            ₹{totalBilled.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Standard Term Dues</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-slate-500 text-xs block mb-1">Total Collected</span>
          <div className="text-xl font-bold text-emerald-600 font-mono">
            ₹{totalCollected.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-500 mt-0.5 block">Received in Bank</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-slate-500 text-xs block mb-1">Outstanding Balance</span>
          <div className="text-xl font-bold text-rose-600 font-mono">
            ₹{totalOutstanding.toLocaleString()}
          </div>
          <span className="text-[11px] text-rose-500 mt-0.5 block">Pending Installments</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-slate-500 text-xs block mb-1">Fee Clearance Rate</span>
          <div className="text-xl font-bold text-indigo-600 font-mono">
            {fees.length > 0
              ? `${Math.round((fullyPaidCount / fees.length) * 100)}%`
              : '0%'}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {fullyPaidCount} of {fees.length} Students Cleared
          </span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by student roll number or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
          >
            <option value="">All Statuses</option>
            <option value="Paid">Fully Paid</option>
            <option value="Partial">Partial Payment</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Fees Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Loading fee accounts...
          </div>
        ) : fees.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No fee accounts found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Roll No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4 text-right">Total Fee</th>
                  <th className="py-3 px-4 text-right">Paid Amount</th>
                  <th className="py-3 px-4 text-right">Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fees.map((f) => {
                  const isPaid = f.status === 'Paid';
                  return (
                    <tr key={f.roll_no} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {f.roll_no}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {f.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {f.department} Sem {f.semester}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        ₹{(f.total_amount || 45000).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                        ₹{(f.paid_amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                        ₹{(f.balance || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isPaid ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> Paid
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" /> Partial
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setActiveReceipt(f)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] flex items-center gap-1 mx-auto transition cursor-pointer"
                        >
                          <Receipt className="w-3 h-3 text-indigo-600" />
                          <span>Voucher</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {isPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 relative">
            <button
              onClick={() => setIsPaymentOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Record Fee Payment
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Enter student roll number and installment amount to credit.
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student Roll Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE2024001"
                  value={payData.roll_no}
                  onChange={(e) =>
                    setPayData({
                      ...payData,
                      roll_no: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full px-3 py-2 text-xs font-mono font-bold uppercase bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 20000"
                  value={payData.amount}
                  onChange={(e) =>
                    setPayData({ ...payData, amount: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
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
                  disabled={recording}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {recording ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Voucher Modal */}
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
                Official Tuition Fee Payment Receipt
              </p>
              <div className="inline-block mt-2 px-3 py-0.5 rounded-full bg-slate-100 font-mono text-[11px] text-slate-700 font-bold">
                {activeReceipt.receipt_no || `REC-${activeReceipt.roll_no}`}
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 mb-6">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Student Name:</span>
                <strong className="text-slate-900">{activeReceipt.name}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Roll Number:</span>
                <strong className="font-mono text-slate-900">
                  {activeReceipt.roll_no}
                </strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Course & Semester:</span>
                <span>
                  {activeReceipt.department} Sem {activeReceipt.semester}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Total Tuition Due:</span>
                <span className="font-mono">
                  ₹{(activeReceipt.total_amount || 45000).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700 font-bold">
                <span>Amount Paid:</span>
                <span className="font-mono">
                  ₹{(activeReceipt.paid_amount || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 text-rose-700 font-bold">
                <span>Remaining Balance:</span>
                <span className="font-mono">
                  ₹{(activeReceipt.balance || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Status:</span>
                <strong className="text-indigo-600">
                  {activeReceipt.status}
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
                <span>Print Voucher</span>
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