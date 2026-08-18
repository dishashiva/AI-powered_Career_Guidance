import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — clear token and redirect for protected routes only
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/')) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => client.post('/auth/register', data),
  login: (email, password) => {
    const form = new URLSearchParams();
    form.append('username', email);
    form.append('password', password);
    return client.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },
  forgotPassword: (email) => client.post('/auth/forgot-password', { email }),
  resetPassword: (token, new_password) => client.post('/auth/reset-password', { token, new_password }),
};

// ─── Users ───────────────────────────────────────────────────────
export const usersAPI = {
  getMe: () => client.get('/users/me'),
  updateMe: (data) => client.put('/users/me', data),
  getProfile: () => client.get('/users/me/profile'),
  updateProfile: (data) => client.put('/users/me/profile', data),
  autofillProfile: (resumeId = null, overwrite = true) =>
    client.post(`/users/me/autofill-profile${resumeId ? `?resume_id=${resumeId}&overwrite=${overwrite}` : `?overwrite=${overwrite}`}`),
};

// ─── Resumes ─────────────────────────────────────────────────────
export const resumesAPI = {
  upload: (file, onUploadProgress) => {
    const form = new FormData();
    form.append('file', file);
    return client.post('/resumes/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
  },
  list: () => client.get('/resumes/'),
  get: (id) => client.get(`/resumes/${id}`),
  getStatus: (id) => client.get(`/resumes/${id}/status`),
  delete: (id) => client.delete(`/resumes/${id}`),
  download: (id) => client.get(`/resumes/${id}/download`, { responseType: 'blob' }),
  view: (id) => client.get(`/resumes/${id}/view`, { responseType: 'blob' }),
  autofillProfile: (id, overwrite = true) => client.post(`/resumes/${id}/autofill-profile?overwrite=${overwrite}`),
  compareJd: (data) => client.post('/resumes/compare-jd', data),
  getImprovements: (id) => client.get(`/resumes/${id}/improvements`),
};

// ─── Jobs ────────────────────────────────────────────────────────
export const jobsAPI = {
  getRecommendations: (resumeId = null) =>
    client.get(`/jobs/recommendations${resumeId ? `?resume_id=${resumeId}` : ''}`),
};

// ─── Courses ─────────────────────────────────────────────────────
export const coursesAPI = {
  getRecommendations: (resumeId = null) =>
    client.get(`/courses/recommendations${resumeId ? `?resume_id=${resumeId}` : ''}`),
  getLearningPath: (resumeId = null) =>
    client.get(`/courses/learning-path${resumeId ? `?resume_id=${resumeId}` : ''}`),
};

// ─── AI ──────────────────────────────────────────────────────────
export const aiAPI = {
  chat: (message, resume_id = null) =>
    client.post('/ai/chat', { message, resume_id }),
  salary: (data) => client.post('/ai/salary', data),
  analyze: (resume_id) => client.get(`/ai/analyze/${resume_id}`),
  interviewPrep: (data) => client.post('/ai/interview-prep', data),
};

// ─── Feedback ───────────────────────────────────────────────────
export const feedbackAPI = {
  submit: (data) => client.post('/feedback', data),
  getMy: () => client.get('/feedback/my'),
};

// ─── Announcements ──────────────────────────────────────────────
export const announcementsAPI = {
  getActive: () => client.get('/announcements/active'),
};

// ─── Admin API ──────────────────────────────────────────────────
export const adminAPI = {
  getStats: () => client.get('/admin/stats'),
  listUsers: (params) => client.get('/admin/users', { params }),
  updateUserStatus: (id, is_active) => client.patch(`/admin/users/${id}/status`, { is_active }),
  updateUserRole: (id, is_admin) => client.patch(`/admin/users/${id}/role`, { is_admin }),
  deleteUser: (id) => client.delete(`/admin/users/${id}`),
  resetUserPassword: (id) => client.post(`/admin/users/${id}/reset-password`),
  getUserProfile: (id) => client.get(`/admin/users/${id}/profile`),
  updateUserProfile: (id, data) => client.put(`/admin/users/${id}/profile`, data),

  listResumes: () => client.get('/admin/resumes'),
  getResumeFile: (id) => client.get(`/admin/resumes/${id}/file`, { responseType: 'blob' }),
  getParseStats: () => client.get('/admin/resumes/parse-stats'),

  listJobs: () => client.get('/admin/jobs'),
  scrapeJobs: (params) => client.post('/admin/jobs/scrape', null, { params }),
  updateJob: (id, data) => client.put(`/admin/jobs/${id}`, data),
  deleteJob: (id) => client.delete(`/admin/jobs/${id}`),

  listCourses: () => client.get('/admin/courses'),
  scrapeCourses: (params) => client.post('/admin/courses/scrape', null, { params }),
  updateCourse: (id, data) => client.put(`/admin/courses/${id}`, data),
  deleteCourse: (id) => client.delete(`/admin/courses/${id}`),

  getAtsAnalytics: () => client.get('/admin/analytics/ats'),
  getSkillAnalytics: () => client.get('/admin/analytics/skills'),
  getCareerAnalytics: () => client.get('/admin/analytics/careers'),

  listFeedback: (params) => client.get('/admin/feedback', { params }),
  updateFeedback: (id, data) => client.patch(`/admin/feedback/${id}`, data),
  deleteFeedback: (id) => client.delete(`/admin/feedback/${id}`),

  getActivityLogs: (params) => client.get('/admin/activity-logs', { params }),
  getSystemHealth: () => client.get('/admin/system-health'),
  getAiUsage: () => client.get('/admin/ai-usage'),
  testAiPing: () => client.post('/admin/ai-usage/test-ping'),
  globalSearch: (q) => client.get('/admin/search', { params: { q } }),
  exportReport: (reportType, format = 'csv') =>
    client.get(`/admin/reports/export/${reportType}`, {
      params: { format },
      responseType: format === 'json' ? 'json' : 'blob',
    }),

  listAnnouncements: () => client.get('/admin/announcements'),
  createAnnouncement: (data) => client.post('/admin/announcements', data),
  updateAnnouncement: (id, data) => client.put(`/admin/announcements/${id}`, data),
  deleteAnnouncement: (id) => client.delete(`/admin/announcements/${id}`),
};

export default client;
