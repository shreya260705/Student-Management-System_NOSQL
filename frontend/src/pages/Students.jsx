import React, { useState } from 'react';
import {
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RotateCcw,
  UserX
} from 'lucide-react';

const DEPARTMENTS = ['CSE', 'ECE', 'MECH', 'CIVIL', 'IT', 'AI&DS'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function Students({
  students,
  pagination,
  loading,
  filters,
  onFilterChange,
  onResetFilters,
  onPageChange,
  onViewStudent,
  onEditStudent,
  onDeleteStudent
}) {
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onFilterChange({ search: searchInput, page: 1 });
  };

  const handleClearSearch = () => {
    setSearchInput('');
    onFilterChange({ search: '', page: 1 });
  };

  const getGradeBadge = (grade) => {
    switch (grade) {
      case 'A': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'B': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'C': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'D': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

  return (
    <div className="space-y-5">
      {/* Search & Filter Toolbar */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Search Bar Form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-lg relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, roll number, or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-20 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="text-xs text-slate-400 hover:text-slate-600 px-1.5 py-1"
                >
                  Clear
                </button>
              )}
              <button
                type="submit"
                className="px-2.5 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Find
              </button>
            </div>
          </form>

          {/* Filters & Sorting */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Department Filter */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-slate-500">Dept:</label>
              <select
                value={filters.department || ''}
                onChange={(e) => onFilterChange({ department: e.target.value, page: 1 })}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">All Departments</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Semester Filter */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-slate-500">Sem:</label>
              <select
                value={filters.semester || ''}
                onChange={(e) => onFilterChange({ semester: e.target.value, page: 1 })}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">All Semesters</option>
                {SEMESTERS.map((sem) => (
                  <option key={sem} value={sem}>Sem {sem}</option>
                ))}
              </select>
            </div>

            {/* Sort Field */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-slate-500">Sort:</label>
              <select
                value={filters.sort_by || 'created_at'}
                onChange={(e) => onFilterChange({ sort_by: e.target.value, page: 1 })}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="created_at">Date Enrolled</option>
                <option value="name">Name</option>
                <option value="roll_no">Roll Number</option>
                <option value="average_marks">Average Marks</option>
              </select>
            </div>

            {/* Sort Order Toggle */}
            <button
              onClick={() => onFilterChange({ sort_order: filters.sort_order === 'asc' ? 'desc' : 'asc', page: 1 })}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-medium flex items-center gap-1"
              title={`Sorting: ${filters.sort_order === 'asc' ? 'Ascending' : 'Descending'}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span className="uppercase text-[10px]">{filters.sort_order || 'desc'}</span>
            </button>

            {/* Reset All Filters */}
            <button
              onClick={() => {
                setSearchInput('');
                onResetFilters();
              }}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <UserX className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-slate-800">No students found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No student records matched your current query or filters. Try adjusting your search term or clearing filters.
            </p>
            <button
              onClick={() => {
                setSearchInput('');
                onResetFilters();
              }}
              className="mt-4 px-3.5 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Roll No</th>
                  <th className="py-3 px-4 font-semibold">Student Name</th>
                  <th className="py-3 px-4 font-semibold">Email</th>
                  <th className="py-3 px-4 font-semibold">Department</th>
                  <th className="py-3 px-4 font-semibold">Semester</th>
                  <th className="py-3 px-4 font-semibold">Marks (DBMS/DSA/Py)</th>
                  <th className="py-3 px-4 font-semibold">Average</th>
                  <th className="py-3 px-4 font-semibold">Grade</th>
                  <th className="py-3 px-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => {
                  const m = student.marks || {};
                  return (
                    <tr key={student.id || student._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-indigo-600">{student.roll_no}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{student.name}</td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{student.email}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">{student.department}</td>
                      <td className="py-3.5 px-4 text-slate-600">Sem {student.semester}</td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {m.DBMS ?? 0} / {m.DSA ?? 0} / {m.Python ?? 0}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{student.average_marks}%</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getGradeBadge(student.grade)}`}>
                          {student.grade}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onViewStudent(student)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditStudent(student)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit Student"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteStudent(student)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination && pagination.total_pages > 0 && (
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-800">{students.length}</span> of{' '}
              <span className="font-semibold text-slate-800">{pagination.total}</span> students
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-600">
                Page <span className="font-semibold">{pagination.page}</span> of{' '}
                <span className="font-semibold">{pagination.total_pages}</span>
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={!pagination.has_prev}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={!pagination.has_next}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
