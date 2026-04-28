/**
 * Axios instance and typed API method groups for the Electra backend.
 *
 * FIX #14 — CRITICAL: The axios request interceptor attaches the Firebase ID token.
 * It imports `auth` from ../firebase directly and reads auth.currentUser.getIdToken().
 * React hooks (useAuth) CANNOT be called outside React components.
 * This is the only correct pattern for an axios interceptor.
 */

import axios from 'axios';
import { auth } from '../firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Request interceptor: attach Bearer token if user is signed in ─────────────
api.interceptors.request.use(async (config) => {
  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // Token fetch failed — proceed without auth header (server will return 401)
    }
  }
  return config;
});

// ── Response interceptor: handle 401 and network errors ──────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — sign out and redirect to login
      try { await auth.signOut(); } catch { /* ignore */ }
      window.location.href = '/login';
    } else if (!error.response) {
      // Network error (no response received)
      error.message = 'Network error. Please check your connection and try again.';
    }
    return Promise.reject(error);
  }
);

// ── Typed API method groups ───────────────────────────────────────────────────

export const topicsApi = {
  getAll: (params = {}) => api.get('/topics', { params }).then((r) => r.data),
  getBySlug: (slug)      => api.get(`/topics/${slug}`).then((r) => r.data),
};

export const timelineApi = {
  getEvents: (country, level = null, stateProvince = null) => {
    const params = { country };
    if (level) params.level = level;
    if (stateProvince) params.state_province = stateProvince;
    return api.get('/timeline', { params }).then((r) => r.data);
  },
};

export const quizApi = {
  getQuestions:  (topicId)          => api.get(`/quiz/${topicId}`).then((r) => r.data),
  submitAnswers: (topicId, answers)  => api.post('/quiz/submit', { topic_id: topicId, answers }).then((r) => r.data),
};

export const userApi = {
  getProfile:    ()     => api.get('/user/profile').then((r) => r.data),
  updateProfile: (data) => api.put('/user/profile', data).then((r) => r.data),
  getProgress:   ()     => api.get('/user/progress').then((r) => r.data),
  deleteAccount: ()     => api.delete('/user/account').then((r) => r.data),
};

export const chatApi = {
  sendMessage: (message, sessionId, country, languageCode = 'en') =>
    api.post('/chat', {
      message,
      session_id: sessionId,
      country,
      language_code: languageCode,
    }).then((r) => r.data),
};

export const feedbackApi = {
  submit: (message, category, country = null) =>
    api.post('/feedback', { message, category, country }).then((r) => r.data),
};

export default api;
