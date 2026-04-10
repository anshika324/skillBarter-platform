import axios from 'axios';

// Prefer relative URL so Vite proxy can forward to backend.
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Skills API
export const skillsAPI = {
  getAll: (params) => api.get('/skills', { params }),
  getById: (id) => api.get(`/skills/${id}`),
  create: (data) => api.post('/skills', data),
  update: (id, data) => api.put(`/skills/${id}`, data),
  delete: (id) => api.delete(`/skills/${id}`),
  getByUser: (userId) => api.get(`/skills/user/${userId}`),
  getRecommendations: (userId) => api.get(`/skills/recommendations/${userId}`)
};

// Bookings API
export const bookingsAPI = {
  getAll: (params) => api.get('/bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  create: (data) => api.post('/bookings', data),
  confirm: (id) => api.put(`/bookings/${id}/confirm`),
  complete: (id, data) => api.put(`/bookings/${id}/complete`, data),
  cancel: (id, data) => api.put(`/bookings/${id}/cancel`, data)
};

// Reviews API
export const reviewsAPI = {
  create: (data) => api.post('/reviews', data),
  getByUser: (userId, params) => api.get(`/reviews/user/${userId}`, { params }),
  getBySkill: (skillId) => api.get(`/reviews/skill/${skillId}`),
  getById: (id) => api.get(`/reviews/${id}`)
};

// Video Calls API
export const videoCallsAPI = {
  createFromBooking: (bookingId) => api.post(`/video-calls/create/${bookingId}`),
  getByRoomId: (roomId) => api.get(`/video-calls/room/${roomId}`),
  join: (roomId, data = {}) => api.post(`/video-calls/join/${roomId}`, data),
  leave: (roomId) => api.post(`/video-calls/leave/${roomId}`),
  getUpcoming: () => api.get('/video-calls/upcoming')
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  getById: (id) => api.get(`/users/${id}`),
  update: (data) => api.put('/users/profile', data),
  search: (params) => api.get('/users/search', { params }),
  getMatchmakingProfile: () => api.get('/users/matchmaking-profile'),
  updateMatchmakingProfile: (data) => api.put('/users/matchmaking-profile', data),
  getMatchmakingProfiles: (params) => api.get('/users/matchmaking/profiles', { params }),
  updateAvatar: (avatar) => api.put('/users/avatar', { avatar })
};

// Learning Paths API
export const learningPathsAPI = {
  getAll: (params) => api.get('/learning-paths', { params }),
  getByIdentifier: (identifier) => api.get(`/learning-paths/${identifier}`),
  create: (data) => api.post('/learning-paths', data),
  update: (id, data) => api.put(`/learning-paths/${id}`, data),
  remove: (id) => api.delete(`/learning-paths/${id}`),
  enroll: (pathId) => api.post(`/learning-paths/${pathId}/enroll`),
  getEnrollment: (pathId) => api.get(`/learning-paths/${pathId}/enrollment`),
  getMyEnrollments: (status) =>
    api.get('/learning-paths/my/enrollments', {
      params: status ? { status } : {}
    }),
  completeLesson: (pathId, moduleIndex, lessonIndex, data = {}) =>
    api.post(`/learning-paths/${pathId}/lesson/${moduleIndex}/${lessonIndex}/complete`, data),
  submitQuiz: (pathId, moduleIndex, lessonIndex, answers) =>
    api.post(`/learning-paths/${pathId}/quiz/${moduleIndex}/${lessonIndex}`, { answers }),
  submitProject: (pathId, moduleIndex, lessonIndex, submissionUrl) =>
    api.post(`/learning-paths/${pathId}/project/${moduleIndex}/${lessonIndex}`, { submissionUrl }),
  addNote: (pathId, moduleIndex, lessonIndex, note) =>
    api.post(`/learning-paths/${pathId}/note/${moduleIndex}/${lessonIndex}`, { note }),
  toggleBookmark: (pathId, moduleIndex, lessonIndex) =>
    api.post(`/learning-paths/${pathId}/bookmark/${moduleIndex}/${lessonIndex}`),
  submitRating: (pathId, rating, feedback) =>
    api.post(`/learning-paths/${pathId}/rating`, { rating, feedback }),
  getRecommended: (limit = 6) =>
    api.get('/learning-paths/my/recommended', { params: { limit } }),
  getStats: (pathId) => api.get(`/learning-paths/${pathId}/stats`),
  getCategories: () => api.get('/learning-paths/meta/categories')
};

export default api;
