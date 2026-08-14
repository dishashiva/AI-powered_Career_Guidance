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

// Handle 401 — clear token and redirect
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
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


export default client;
