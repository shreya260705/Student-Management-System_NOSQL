import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Plus,
  Pin,
  Trash2,
  Calendar,
  User,
  Tag,
  X,
  Filter,
} from 'lucide-react';
import { apiService } from '../services/api';

export default function Announcements({ showToast, userRole = 'admin' }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [audienceFilter, setAudienceFilter] = useState('');

  // Create modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'Academic',
    target_audience: 'All',
    is_pinned: false,
    author_name: 'Administration Office',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.getAnnouncements(audienceFilter);
      setAnnouncements(res.announcements || []);
    } catch (err) {
      showToast(err.message || 'Failed to load announcements', 'error');
    } finally {
      setLoading(false);
    }
  }, [audienceFilter, showToast]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;
    setSubmitting(true);
    try {
      await apiService.createAnnouncement(formData);
      showToast('Announcement posted successfully!', 'success');
      setIsCreateOpen(false);
      setFormData({
        title: '',
        content: '',
        category: 'Academic',
        target_audience: 'All',
        is_pinned: false,
        author_name: 'Administration Office',
      });
      loadAnnouncements();
    } catch (err) {
      showToast(err.message || 'Failed to post announcement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await apiService.deleteAnnouncement(id);
      showToast('Announcement removed.', 'success');
      loadAnnouncements();
    } catch (err) {
      showToast(err.message || 'Failed to delete announcement', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-7 h-7 text-indigo-600" />
            Institutional Announcements & Notice Board
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Broadcast official circulars, examination updates, and academic notifications.
          </p>
        </div>

        {userRole !== 'student' && (
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Announcement</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700">
            Target Audience Filter:
          </span>
          <select
            value={audienceFilter}
            onChange={(e) => setAudienceFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
          >
            <option value="">All Audiences</option>
            <option value="all">Campus-Wide (All)</option>
            <option value="teachers">Faculty Only</option>
            <option value="students">Students Only</option>
          </select>
        </div>

        <span className="text-xs text-slate-500">
          Total Notices: <strong className="text-slate-900">{announcements.length}</strong>
        </span>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-xs">
          Loading announcements...
        </div>
      ) : announcements.length === 0 ? (
        <div className="p-16 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
          No announcements published yet.
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div
              key={ann.id || ann._id}
              className={`bg-white p-6 rounded-2xl border transition shadow-sm ${
                ann.is_pinned
                  ? 'border-indigo-300 ring-2 ring-indigo-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex flex-wrap items-center gap-2">
                  {ann.is_pinned && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-extrabold uppercase tracking-wide border border-indigo-200">
                      <Pin className="w-3 h-3 text-indigo-600" /> Pinned
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                    {ann.category || 'General'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-500 border border-slate-200">
                    Audience: {ann.target_audience || 'All'}
                  </span>
                </div>

                {userRole === 'admin' && (
                  <button
                    type="button"
                    onClick={() => handleDelete(ann.id || ann._id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                    title="Delete Announcement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-2">
                {ann.title}
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line mb-4">
                {ann.content}
              </p>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Posted by: {ann.author_name || 'Academic Dean'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {ann.created_at
                      ? new Date(ann.created_at).toLocaleDateString()
                      : 'Recent'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Publish Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 relative">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Publish Notice / Circular
            </h2>
            <form onSubmit={handleCreate} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule for Mid-Term Examinations"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Academic">Academic Notice</option>
                    <option value="Exam">Examination</option>
                    <option value="Event">Event / Workshop</option>
                    <option value="General">General Circular</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Audience
                  </label>
                  <select
                    value={formData.target_audience}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        target_audience: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="All">All Campus</option>
                    <option value="Teachers">Faculty & Staff</option>
                    <option value="Students">Enrolled Students</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Announcement Body
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detailed circular text..."
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinNotice"
                  checked={formData.is_pinned}
                  onChange={(e) =>
                    setFormData({ ...formData, is_pinned: e.target.checked })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <label htmlFor="pinNotice" className="text-xs text-slate-700 font-medium">
                  Pin to top of notice board
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
