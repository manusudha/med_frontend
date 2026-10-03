/**
 * ─────────────────────────────────────────────────────────────
 *  COMMON API FILE — every request to the backend goes through here.
 *  The base URL comes from VITE_API_URL in the .env files.
 * ─────────────────────────────────────────────────────────────
 */
import axios from 'axios';

export const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const TOKEN_KEY = 'ae_token';
const CLINIC_KEY = 'ae_clinic_code';

export const storage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (t) => localStorage.setItem(TOKEN_KEY, t),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
  getClinicCode: () => localStorage.getItem(CLINIC_KEY) || '',
  setClinicCode: (c) => localStorage.setItem(CLINIC_KEY, c),
};

const http = axios.create({ baseURL: API_URL, timeout: 20000 });

http.interceptors.request.use((config) => {
  const token = storage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onSessionExpired = () => {};
/** AuthContext registers what happens on a 401 (log out + go to login). */
export const setSessionExpiredHandler = (fn) => { onSessionExpired = fn; };

http.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const status = err.response?.status;
    let message = err.response?.data?.message;
    if (!message) {
      if (err.code === 'ECONNABORTED') message = 'The server took too long to respond. Try again.';
      else if (!err.response) message = "Can't reach the server. Check your internet connection.";
      else message = 'Something went wrong. Please try again.';
    }
    if (status === 401 && !err.config?.skipSessionCheck) {
      storage.clearToken();
      onSessionExpired(message);
    }
    const e = new Error(message);
    e.status = status;
    e.errors = err.response?.data?.errors || [];
    return Promise.reject(e);
  },
);

const get = (url, params) => http.get(url, { params });
const post = (url, body, config) => http.post(url, body, config);
const patch = (url, body) => http.patch(url, body);
const put = (url, body) => http.put(url, body);
const del = (url) => http.delete(url);

const api = {
  health: () => get('/health'),

  auth: {
    login: (clinicCode, loginId, password) =>
      post('/auth/login', { clinicCode, loginId, password }, { skipSessionCheck: true }),
    me: () => get('/auth/me'),
    changePassword: (currentPassword, newPassword) => post('/auth/change-password', { currentPassword, newPassword }),
  },

  clinic: {
    get: () => get('/clinic'),
    update: (body) => patch('/clinic', body),
  },

  patients: {
    list: (params) => get('/patients', params),
    get: (id) => get(`/patients/${id}`),
    create: (body) => post('/patients', body),
    update: (id, body) => patch(`/patients/${id}`, body),
    visits: (id) => get(`/patients/${id}/visits`),
    prescriptions: (id) => get(`/patients/${id}/prescriptions`),
    sheets: (id) => get(`/patients/${id}/sheets`),
    resetPassword: (id) => post(`/patients/${id}/reset-password`),
  },

  appointments: {
    list: (params) => get('/appointments', params),     // { scope: 'today' | 'upcoming' | 'past', q, status, page }
    stats: () => get('/appointments/stats'),
    create: (body) => post('/appointments', body),
    update: (id, body) => patch(`/appointments/${id}`, body),
  },

  admissions: {
    list: (status = 'admitted') => get('/admissions', { status }),
    create: (body) => post('/admissions', body),
    get: (id) => get(`/admissions/${id}`),
    update: (id, body) => patch(`/admissions/${id}`, body),
    discharge: (id) => post(`/admissions/${id}/discharge`),
    getDay: (id, day) => get(`/admissions/${id}/days/${day}`),
    saveDay: (id, day, body) => put(`/admissions/${id}/days/${day}`, body),
  },

  prescriptions: {
    create: (body) => post('/prescriptions', body),
    update: (id, body) => patch(`/prescriptions/${id}`, body),
  },

  stock: {
    list: (params) => get('/stock', params),
    save: (body) => post('/stock', body),              // add or restock
    update: (id, body) => patch(`/stock/${id}`, body),
    remove: (id) => del(`/stock/${id}`),
  },

  roles: {
    list: (all = false) => get('/roles', all ? { all: 1 } : undefined),
    create: (body) => post('/roles', body),
    update: (id, body) => patch(`/roles/${id}`, body),
    remove: (id) => del(`/roles/${id}`),
  },

  users: {
    list: (params) => get('/users', params),
    doctors: () => get('/users/doctors'),
    create: (body) => post('/users', body),
    update: (id, body) => patch(`/users/${id}`, body),
    resetPassword: (id, password) => post(`/users/${id}/reset-password`, password ? { password } : {}),
  },

  portal: {
    profile: () => get('/portal/profile'),
    appointments: () => get('/portal/appointments'),
    requestAppointment: (body) => post('/portal/appointments', body),
    prescriptions: () => get('/portal/prescriptions'),
  },
};

export default api;
