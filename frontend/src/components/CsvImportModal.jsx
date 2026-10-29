import React, { useState } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { apiService } from '../services/api';

const SAMPLE_CSV = `Roll No,Full Name,Email,Department,Semester,DBMS,DSA,Python
CSE2026101,Karan Mehra,karan.mehra@example.com,CSE,4,85,90,88
IT2026102,Simran Kaur,simran.kaur@example.com,IT,4,78,82,80
AIDS2026103,Nikhil Sharma,nikhil.sharma@example.com,AI&DS,2,92,95,94`;

export default function CsvImportModal({ isOpen, onClose, onImportSuccess }) {
  const [csvContent, setCsvContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvContent(event.target?.result || '');
      setError('');
    };
    reader.readAsText(file);
  };

  const handleFillSample = () => {
    setCsvContent(SAMPLE_CSV);
    setError('');
  };

  const handleImport = async () => {
    if (!csvContent.trim()) {
      setError('Please provide CSV data either by uploading a file or pasting text.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await apiService.importCsv(csvContent);
      setResult(res);
      if (res.inserted > 0 || res.updated > 0) {
        onImportSuccess();
      }
    } catch (err) {
      setError(err.message || 'CSV import failed. Please verify headers.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Import Students via CSV
            </h2>
            <p className="text-xs text-slate-500">
              Batch create or update student records with duplicate detection.
            </p>
          </div>
        </div>

        {error && (
          <div className="my-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="my-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
            <div className="flex items-center gap-2 font-bold mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{result.message}</span>
            </div>
            {result.errors && result.errors.length > 0 && (
              <div className="mt-2 text-[11px] text-amber-800 space-y-0.5">
                <span className="font-semibold">Import Notes:</span>
                {result.errors.map((e, idx) => (
                  <div key={idx}>• {e}</div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-4 my-4">
          {/* File input */}
          <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-4 text-center cursor-pointer transition bg-slate-50/50">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csvFileInput"
            />
            <label htmlFor="csvFileInput" className="cursor-pointer block">
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
              <span className="text-xs font-semibold text-slate-700 block">
                Click to choose CSV file
              </span>
              <span className="text-[11px] text-slate-400">
                Supports .csv formatted student lists
              </span>
            </label>
          </div>

          {/* Paste CSV area */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Or Paste CSV Content Directly:
              </label>
              <button
                type="button"
                onClick={handleFillSample}
                className="text-[11px] text-indigo-600 font-semibold hover:underline"
              >
                Insert Sample Template
              </button>
            </div>
            <textarea
              rows={5}
              placeholder="Roll No,Full Name,Email,Department,Semester,DBMS,DSA,Python..."
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              className="w-full p-3 font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Upserts existing roll numbers safely
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              <span>Import Students</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
