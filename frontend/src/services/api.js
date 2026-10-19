/**
 * api.js - Centralized API Service for communicating with Flask + PyMongo backend.
 */

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || (data.details && typeof data.details === 'object' ? Object.values(data.details).join(', ') : 'An unexpected error occurred');
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    if (!error.status) {
      error.message = error.message || 'Cannot connect to backend server. Make sure Flask is running on port 5000.';
    }
    throw error;
  }
}

export const apiService = {
  // Health & connection status
  getHealth: () => request('/health'),

  // Dashboard summary stats
  getDashboardStats: () => request('/dashboard/stats'),

  // Students list with pagination, search, filter, and sort
  getStudents: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.search) query.append('search', params.search);
    if (params.department) query.append('department', params.department);
    if (params.semester) query.append('semester', params.semester);
    if (params.sort_by) query.append('sort_by', params.sort_by);
    if (params.sort_order) query.append('sort_order', params.sort_order);

    const queryString = query.toString();
    return request(`/students${queryString ? `?${queryString}` : ''}`);
  },

  // Single student by ID
  getStudentById: (id) => request(`/students/${id}`),

  // Create student
  createStudent: (payload) => request('/students', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Update student
  updateStudent: (id, payload) => request(`/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),

  // Delete student
  deleteStudent: (id) => request(`/students/${id}`, {
    method: 'DELETE',
  }),

  // 5 MongoDB Aggregation endpoints
  getDepartmentCounts: () => request('/analytics/department-counts'),
  getDepartmentAverages: () => request('/analytics/department-averages'),
  getTopStudents: (limit = 5) => request(`/analytics/top-students?limit=${limit}`),
  getGradeDistribution: () => request('/analytics/grade-distribution'),
  getSemesterCounts: () => request('/analytics/semester-counts'),
};
