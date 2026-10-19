import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Sparkles } from 'lucide-react';

const DEPARTMENTS = ['CSE', 'ECE', 'MECH', 'CIVIL', 'IT', 'AI&DS'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function StudentFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isSubmitting = false,
}) {
  const isEditMode = Boolean(initialData);

  const [formData, setFormData] = useState({
    roll_no: '',
    name: '',
    email: '',
    department: 'CSE',
    semester: 1,
    marks: {
      DBMS: 75,
      DSA: 75,
      Python: 75,
    },
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  // Prepopulate form when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        roll_no: initialData.roll_no || '',
        name: initialData.name || '',
        email: initialData.email || '',
        department: initialData.department || 'CSE',
        semester: initialData.semester || 1,
        marks: {
          DBMS: initialData.marks?.DBMS ?? 75,
          DSA: initialData.marks?.DSA ?? 75,
          Python: initialData.marks?.Python ?? 75,
        },
      });
    } else {
      setFormData({
        roll_no: '',
        name: '',
        email: '',
        department: 'CSE',
        semester: 1,
        marks: {
          DBMS: 75,
          DSA: 75,
          Python: 75,
        },
      });
    }
    setErrors({});
    setServerError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};

    if (!formData.roll_no.trim()) {
      newErrors.roll_no = 'Roll number is required.';
    } else if (formData.roll_no.trim().length < 3) {
      newErrors.roll_no = 'Roll number must be at least 3 characters.';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required.';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Enter a valid email address.';
    }

    // Validate marks
    ['DBMS', 'DSA', 'Python'].forEach((subject) => {
      const val = formData.marks[subject];
      if (val === '' || val === null || val === undefined) {
        newErrors[`marks.${subject}`] = `${subject} marks required.`;
      } else {
        const num = Number(val);
        if (isNaN(num) || num < 0 || num > 100) {
          newErrors[`marks.${subject}`] = `${subject} marks must be between 0 and 100.`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    try {
      const payload = {
        ...formData,
        roll_no: formData.roll_no.trim().toUpperCase(),
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        semester: parseInt(formData.semester, 10),
        marks: {
          DBMS: Number(formData.marks.DBMS),
          DSA: Number(formData.marks.DSA),
          Python: Number(formData.marks.Python),
        },
      };

      await onSubmit(payload, initialData?.id || initialData?._id);
    } catch (err) {
      if (err.data && err.data.details) {
        if (typeof err.data.details === 'object') {
          setErrors(err.data.details);
        } else {
          setServerError(String(err.data.details));
        }
      } else {
        setServerError(err.message || 'Operation failed');
      }
    }
  };

  const handleMarkChange = (subject, value) => {
    setFormData((prev) => ({
      ...prev,
      marks: {
        ...prev.marks,
        [subject]: value,
      },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {isEditMode ? 'Edit Student Record' : 'Enroll New Student'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditMode
                  ? 'Update existing student profile and academic marks in MongoDB'
                  : 'Add a new student document to the MongoDB database'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          {serverError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Roll Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Roll Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. CSE2026001"
                disabled={isEditMode}
                value={formData.roll_no}
                onChange={(e) => setFormData({ ...formData, roll_no: e.target.value })}
                className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono uppercase ${
                  errors.roll_no ? 'border-rose-300 bg-rose-50/50' : 'border-slate-300'
                } ${isEditMode ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
              />
              {errors.roll_no && <p className="text-[11px] text-rose-500 mt-1">{errors.roll_no}</p>}
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Rahul Kumar"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                  errors.name ? 'border-rose-300 bg-rose-50/50' : 'border-slate-300'
                }`}
              />
              {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                placeholder="e.g. rahul@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                  errors.email ? 'border-rose-300 bg-rose-50/50' : 'border-slate-300'
                }`}
              />
              {errors.email && <p className="text-[11px] text-rose-500 mt-1">{errors.email}</p>}
            </div>

            {/* Department & Semester */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Semester</label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {SEMESTERS.map((sem) => (
                    <option key={sem} value={sem}>Sem {sem}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Academic Marks (Nested BSON Document) */}
          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Academic Marks (0 - 100)
            </h4>
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              {['DBMS', 'DSA', 'Python'].map((sub) => (
                <div key={sub}>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {sub} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.marks[sub]}
                    onChange={(e) => handleMarkChange(sub, e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white ${
                      errors[`marks.${sub}`] ? 'border-rose-300 bg-rose-50/50' : 'border-slate-300'
                    }`}
                  />
                  {errors[`marks.${sub}`] && (
                    <p className="text-[10px] text-rose-500 mt-1">{errors[`marks.${sub}`]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Average calculation preview */}
          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
            <span className="text-indigo-900 font-medium">Estimated Average Marks:</span>
            <span className="font-bold text-indigo-700 text-sm">
              {((Number(formData.marks.DBMS || 0) + Number(formData.marks.DSA || 0) + Number(formData.marks.Python || 0)) / 3.0).toFixed(2)}%
            </span>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : isEditMode ? 'Update Student' : 'Save Student'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
