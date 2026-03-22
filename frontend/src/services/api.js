/**
 * ClearHost Staff — Servicio API.
 */
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 
  (import.meta.env.DEV ? 'http://localhost:8000/api' : '/api');

export const STATIC_BASE = import.meta.env.DEV 
  ? 'http://localhost:8000' 
  : '';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: agregar token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ========== AUTH ==========
export const login = async (identificador, password) => {
  const res = await api.post('/staff/login', { identificador, password });
  localStorage.setItem('auth_token', res.data.access_token);
  localStorage.setItem('staff_data', JSON.stringify(res.data.staff));
  return res.data;
};

export const logout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('staff_data');
};

export const getStoredStaff = () => {
  const data = localStorage.getItem('staff_data');
  return data ? JSON.parse(data) : null;
};

export const isAuthenticated = () => !!localStorage.getItem('auth_token');

// ========== TAREAS ==========
export const getTareasDeHoy = async (staffId) => {
  const res = await api.get(`/tareas/hoy/${staffId}`);
  return res.data;
};

export const getTareaDetalle = async (tareaId) => {
  const res = await api.get(`/tareas/${tareaId}`);
  return res.data;
};

export const actualizarChecklist = async (tareaId, checklist) => {
  const res = await api.put(`/tareas/${tareaId}/checklist`, { checklist });
  return res.data;
};

export const aceptarTarea = async (tareaId) => {
  const res = await api.put(`/tareas/${tareaId}/aceptar`);
  return res.data;
};

export const generarLinkWhatsApp = async (tareaId) => {
  const res = await api.post(`/tareas/${tareaId}/whatsapp-link`);
  return res.data;
};

export const actualizarAuditoria = async (tareaId, auditoria_activos) => {
  const res = await api.put(`/tareas/${tareaId}/auditoria`, { auditoria_activos });
  return res.data;
};

export const subirFoto = async (tareaId, tipo, file) => {
  const formData = new FormData();
  formData.append('tipo', tipo);
  formData.append('foto', file);
  const res = await api.post(`/tareas/${tareaId}/fotos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const completarTarea = async (tareaId) => {
  const res = await api.put(`/tareas/${tareaId}/completar`);
  return res.data;
};

// ========== ADMIN: TAREAS ==========
export const verificarTarea = async (tareaId) => {
  const res = await api.put(`/tareas/${tareaId}/verificar`);
  return res.data;
};

export const asignarTarea = async (tareaId, staffId) => {
  const res = await api.put(`/tareas/${tareaId}/asignar`, null, {
    params: staffId ? { staff_id: staffId } : {},
  });
  return res.data;
};

export const autoAsignarTareas = async () => {
  const res = await api.post('/tareas/auto-asignar');
  return res.data;
};

// ========== ICAL SYNC ==========
export const syncIcalAll = async () => {
  const res = await api.post('/sync-ical-all');
  return res.data;
};

export const syncIcalPropiedad = async (propiedadId) => {
  const res = await api.post(`/reservas/sync-ical/${propiedadId}`);
  return res.data;
};

// ========== STAFF ADMIN ==========
export const actualizarStaff = async (staffId, data) => {
  const res = await api.put(`/staff/${staffId}`, data);
  return res.data;
};

export const getBilleteraStaff = async (staffId) => {
  const res = await api.get(`/staff/${staffId}/billetera`);
  return res.data;
};

export const crearAdelanto = async (data) => {
  const res = await api.post('/staff/adelantos', data);
  return res.data;
};

// ========== PROPIETARIOS ==========
export const getPropietarios = async () => {
  const res = await api.get('/propietarios/');
  return res.data;
};

export const crearPropietario = async (data) => {
  const res = await api.post('/propietarios/', data);
  return res.data;
};

export const actualizarPropietario = async (id, data) => {
  const res = await api.put(`/propietarios/${id}`, data);
  return res.data;
};

export const eliminarPropietario = async (id) => {
  const res = await api.delete(`/propietarios/${id}`);
  return res.data;
};

export default api;
