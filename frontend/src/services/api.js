// src/services/api.js - UPDATED
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  }
};

// Doctors API
export const doctorsAPI = {
  getAll: (params) => api.get('/doctors', { params }),
  getById: (id) => api.get(`/doctors/${id}`),
  getSpecializations: () => api.get('/doctors/specializations'),
  getSchedule: (id, date) => api.get(`/doctors/${id}/schedule`, { params: { date } }),
};

// Appointments API
export const appointmentsAPI = {
  getAll: (params) => api.get('/appointments', { params }),
  getById: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  cancel: (id) => api.delete(`/appointments/${id}`),
  getAvailableSlots: (doctorId, date) =>
    api.get('/appointments/available-slots', { params: { doctorId, date } }),
};

// Patients API
export const patientsAPI = {
  getAll: () => api.get('/patients'),
  getById: (id) => api.get(`/patients/${id}`),
  update: (id, data) => api.put(`/patients/${id}`, data),
  getMedicalHistory: (id) => api.get(`/patients/${id}/medical-history`),
  getPrescriptions: (id) => api.get(`/patients/${id}/prescriptions`),
};

// Billing API
export const billingAPI = {
  getAll: (params) => api.get('/billing', { params }),
  getById: (id) => api.get(`/billing/${id}`),
  create: (data) => api.post('/billing', data),
  recordPayment: (id, data) => api.post(`/billing/${id}/payment`, data),
};

// Payment API
export const paymentAPI = {
  initiate: (data) => api.post('/payments/initiate', data),
  process: (data) => api.post('/payments/process', data),
  checkStatus: (ref) => api.get(`/payments/status/${ref}`),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getRoles: () => api.get('/admin/roles'),
  getUsers: () => api.get('/admin/users'),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  toggleUserStatus: (id) => api.put(`/admin/users/${id}/toggle-status`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

export default api;