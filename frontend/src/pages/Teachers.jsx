import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Mail,
  Phone,
  Trash2,
  BookOpen,
  X,
  AlertCircle,
  Building,
  Edit2,
} from 'lucide-react';
import { apiService } from '../services/api';

const DEPARTMENTS = ['CSE', 'IT', 'AI&DS', 'ECE', 'MECH', 'CIVIL'];

export default function Teachers({ showToast }) {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Add modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    teacher_id: '',
    name: '',
    email: '',
    department: 'CSE',
    phone: '',
    designation: 'Assistant Professor',
    assigned_subjects: 'DBMS, DSA',
    assigned_classes: 'CSE-Sem4, CSE-Sem6',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTeacherId, setEditTeacherId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    department: 'IT',
    phone: '',
    designation: '',
    assigned_subjects: '',
    assigned_classes: '',
  });

  const handleOpenEdit = (t) => {
    setEditTeacherId(t.teacher_id || t.id || t._id);
    setEditFormData({
      name: t.name || '',
      department: t.department || 'IT',
      phone: t.phone || '',
      designation: t.designation || '',
      assigned_subjects: Array.isArray(t.assigned_subjects)
        ? t.assigned_subjects.join(', ')
        : (t.assigned_subjects || ''),
      assigned_classes: Array.isArray(t.assigned_classes)
        ? t.assigned_classes.join(', ')
        : (t.assigned_classes || ''),
    });
    setError('');
    setIsEditOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const subjectsList = editFormData.assigned_subjects
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const classesList = editFormData.assigned_classes
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      await apiService.updateTeacher(editTeacherId, {
        name: editFormData.name.trim(),
        department: editFormData.department,
        phone: editFormData.phone.trim(),
        designation: editFormData.designation.trim(),
        assigned_subjects: subjectsList,
        assigned_classes: classesList,
      });

      showToast('Faculty assignments updated successfully!', 'success');
      setIsEditOpen(false);
      loadTeachers();
    } catch (err) {
      setError(err.message || 'Failed to update faculty member.');
    } finally {
      setSubmitting(false);
    }
  };

  const loadTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.getTeachers({
        department: deptFilter,
        search,
      });
      setTeachers(res.teachers || []);
    } catch (err) {
      showToast(err.message || 'Failed to load teachers', 'error');
    } finally {
      setLoading(false);
    }
  }, [deptFilter, search, showToast]);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const subjectsList = formData.assigned_subjects
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const classesList = formData.assigned_classes
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      await apiService.createTeacher({
        teacher_id: formData.teacher_id.trim().toUpperCase(),
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        department: formData.department,
        phone: formData.phone.trim(),
        designation: formData.designation,
        assigned_subjects: subjectsList,
        assigned_classes: classesList,
      });

      showToast('Faculty member registered successfully!', 'success');
      setIsAddOpen(false);
      setFormData({
        teacher_id: '',
        name: '',
        email: '',
        department: 'CSE',
        phone: '',
        designation: 'Assistant Professor',
        assigned_subjects: 'DBMS, DSA',
        assigned_classes: 'CSE-Sem4, CSE-Sem6',
      });
      loadTeachers();
    } catch (err) {
      setError(err.message || 'Failed to register teacher.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove faculty member "${name}"?`)) {
      return;
    }
    try {
      await apiService.deleteTeacher(id);
      showToast('Faculty record removed.', 'success');
      loadTeachers();
    } catch (err) {
      showToast(err.message || 'Failed to delete teacher', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-indigo-600" />
            Faculty & Teachers Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage academic instructors, course allocations, and teaching assignments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Faculty Member</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search faculty by name, ID, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-semibold">
          Total Faculty: <span className="text-slate-900 font-bold">{teachers.length}</span>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Loading faculty records...
          </div>
        ) : teachers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No faculty members found. Click "Add Faculty Member" to register.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Faculty ID</th>
                  <th className="py-3 px-4">Name & Designation</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Assigned Subjects</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.map((t) => (
                  <tr key={t.teacher_id || t.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {t.teacher_id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {t.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {t.designation || 'Instructor'}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                        {t.department}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{t.email}</span>
                      </div>
                      {t.phone && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{t.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(t.assigned_subjects || []).map((sub, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                          title="Edit Faculty Subjects & Profile"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(t.teacher_id || t.id, t.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Remove Teacher"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Teacher Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 relative">
            <button
              onClick={() => setIsAddOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Add Faculty Member
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Enter academic credentials and assign teaching responsibilities.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Faculty ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-generated if blank"
                    value={formData.teacher_id}
                    onChange={(e) =>
                      setFormData({ ...formData, teacher_id: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Ramesh Gupta"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@institution.edu"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Designation / Academic Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Associate Professor / Department Head"
                  value={formData.designation}
                  onChange={(e) =>
                    setFormData({ ...formData, designation: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Subjects (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="DBMS, DSA, Python"
                  value={formData.assigned_subjects}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      assigned_subjects: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Save Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 relative">
            <button
              onClick={() => setIsEditOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Edit Faculty & Assigned Subjects
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Update teaching assignments, eligible attendance subjects, and contact details.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Faculty Member Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    value={editFormData.department}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, department: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={editFormData.designation}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, designation: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Assigned Subjects (Eligible for Attendance Marking)
                  </label>
                  <span className="text-[10px] text-indigo-600 font-bold">
                    Comma-separated
                  </span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="DBMS, Python, DSA, Web Technologies"
                  value={editFormData.assigned_subjects}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      assigned_subjects: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  The instructor will dynamically only be able to mark attendance for these specific subjects.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Classes (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="IT-Sem4, CSE-Sem4"
                  value={editFormData.assigned_classes}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      assigned_classes: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Update Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
