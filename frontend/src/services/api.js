/**
 * api.js - Centralized API Service for communicating with Flask + PyMongo backend.
 * Automatically injects authorization bearer tokens and provides methods for all
 * academic, administrative, and role-based modules.
 */

const API_BASE = '/api';

export function getStoredToken() {
  return localStorage.getItem('edumanage_token') || '';
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem('edumanage_token', token);
  } else {
    localStorage.removeItem('edumanage_token');
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('edumanage_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem('edumanage_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('edumanage_user');
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = getStoredToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('text/csv')) {
      const blob = await response.blob();
      return blob;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg =
        data.error ||
        (data.details && typeof data.details === 'object'
          ? Object.values(data.details).join(', ')
          : 'An unexpected error occurred');
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    if (!error.status) {
      error.message =
        error.message ||
        'Cannot connect to backend server. Make sure Flask is running on port 5000.';
    }
    throw error;
  }
}

export const apiService = {
  // System Health
  getHealth: () => request('/health'),

  // Public Landing Page & Stats
  getPublicStats: () => request('/public/stats'),
  submitContact: (payload) =>
    request('/public/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Authentication
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  googleAuth: (payload) =>
    request('/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  register: (payload) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMe: () => request('/auth/me'),
  forgotPassword: (email) =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (payload) =>
    request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Dashboard Stats
  getDashboardStats: () => request('/dashboard/stats'),

  // Students CRUD & CSV
  getTeacherStudents: (params = {}) => {
    const query = new URLSearchParams();
    if (params.class_id) query.append('class_id', params.class_id);
    if (params.subject) query.append('subject', params.subject);
    if (params.teacher) query.append('teacher', params.teacher);
    const qs = query.toString();
    return request(`/teacher/students${qs ? `?${qs}` : ''}`);
  },
  getStudents: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.search) query.append('search', params.search);
    if (params.department) query.append('department', params.department);
    if (params.semester) query.append('semester', params.semester);
    if (params.status) query.append('status', params.status);
    if (params.subject) query.append('subject', params.subject);
    if (params.classes) query.append('classes', params.classes);
    if (params.scope) query.append('scope', params.scope);
    if (params.sort_by) query.append('sort_by', params.sort_by);
    if (params.sort_order) query.append('sort_order', params.sort_order);

    const qs = query.toString();
    return request(`/students${qs ? `?${qs}` : ''}`);
  },
  getStudentById: (id) => request(`/students/${id}`),
  createStudent: (payload) =>
    request('/students', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateStudent: (id, payload) =>
    request(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteStudent: (id) =>
    request(`/students/${id}`, {
      method: 'DELETE',
    }),
  archiveStudent: (id) =>
    request(`/students/${id}/archive`, {
      method: 'PUT',
    }),
  importCsv: (csv_data) =>
    request('/students/import/csv', {
      method: 'POST',
      body: JSON.stringify({ csv_data }),
    }),

  // Teachers
  getTeachers: (params = {}) => {
    const query = new URLSearchParams();
    if (params.department) query.append('department', params.department);
    if (params.search) query.append('search', params.search);
    const qs = query.toString();
    return request(`/teachers${qs ? `?${qs}` : ''}`);
  },
  createTeacher: (payload) =>
    request('/teachers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateTeacher: (id, payload) =>
    request(`/teachers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteTeacher: (id) =>
    request(`/teachers/${id}`, {
      method: 'DELETE',
    }),

  // Academic Courses, Classes, Subjects
  getCourses: () => request('/academic/courses'),
  createCourse: (payload) =>
    request('/academic/courses', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getClasses: () => request('/academic/classes'),
  createClass: (payload) =>
    request('/academic/classes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getSubjects: () => request('/academic/subjects'),
  getAllocations: (params = {}) => {
    const query = new URLSearchParams();
    if (params.department) query.append('department', params.department);
    if (params.semester) query.append('semester', params.semester);
    const qs = query.toString();
    return request(`/academic/allocations${qs ? `?${qs}` : ''}`);
  },
  createAllocation: (payload) =>
    request('/academic/allocations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteAllocation: (id) =>
    request(`/academic/allocations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  // Attendance
  getAttendance: (params = {}) => {
    const query = new URLSearchParams();
    if (params.date) query.append('date', params.date);
    if (params.department) query.append('department', params.department);
    if (params.semester) query.append('semester', params.semester);
    if (params.subject) query.append('subject', params.subject);
    const qs = query.toString();
    return request(`/attendance${qs ? `?${qs}` : ''}`);
  },
  recordAttendance: (payload) =>
    request('/attendance', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getAttendanceSummary: (params = {}) => {
    const query = new URLSearchParams();
    if (params.department) query.append('department', params.department);
    if (params.semester) query.append('semester', params.semester);
    const qs = query.toString();
    return request(`/attendance/summary${qs ? `?${qs}` : ''}`);
  },
  getStudentAttendance: (roll_no) =>
    request(`/attendance/student/${encodeURIComponent(roll_no)}`),

  // Exams, Marks & Report Cards
  getExams: () => request('/exams'),
  createExam: (payload) =>
    request('/exams', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  togglePublishExam: (exam_id) =>
    request(`/exams/${exam_id}/publish`, {
      method: 'PUT',
    }),
  batchUpdateMarks: (payload) =>
    request('/marks/batch', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getReportCard: (roll_no) =>
    request(`/report-card/${encodeURIComponent(roll_no)}`),

  // Timetable
  getTimetable: (params = {}) => {
    const query = new URLSearchParams();
    if (params.department) query.append('department', params.department);
    if (params.semester) query.append('semester', params.semester);
    if (params.day) query.append('day', params.day);
    if (params.teacher) query.append('teacher', params.teacher);
    if (params.scope) query.append('scope', params.scope);
    if (params.student) query.append('student', params.student);
    if (params.subjects) query.append('subjects', params.subjects);
    const qs = query.toString();
    return request(`/timetable${qs ? `?${qs}` : ''}`);
  },
  addTimetableSlot: (payload) =>
    request('/timetable', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteTimetableSlot: (id) =>
    request(`/timetable/${id}`, {
      method: 'DELETE',
    }),

  // Fees
  getFees: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.roll_no) query.append('roll_no', params.roll_no);
    const qs = query.toString();
    return request(`/fees${qs ? `?${qs}` : ''}`);
  },
  recordPayment: (payload) =>
    request('/fees/payment', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Announcements
  getAnnouncements: (audience = '') => {
    const qs = audience ? `?audience=${encodeURIComponent(audience)}` : '';
    return request(`/announcements${qs}`);
  },
  createAnnouncement: (payload) =>
    request('/announcements', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteAnnouncement: (id) =>
    request(`/announcements/${id}`, {
      method: 'DELETE',
    }),

  // 5 MongoDB Aggregation endpoints (CSE494)
  getDepartmentCounts: () => request('/analytics/department-counts'),
  getDepartmentAverages: () => request('/analytics/department-averages'),
  getTopStudents: (limit = 5) =>
    request(`/analytics/top-students?limit=${limit}`),
  getGradeDistribution: () => request('/analytics/grade-distribution'),
  getSemesterCounts: () => request('/analytics/semester-counts'),
};
