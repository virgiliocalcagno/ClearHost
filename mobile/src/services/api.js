/**
 * ClearHost Staff — Servicio API.
 * Comunicación con el backend FastAPI.
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// URL base dinámica según plataforma
const API_HOST = Platform.select({
  web: 'http://localhost:8000',
  android: 'http://10.0.2.2:8000',
  ios: 'http://localhost:8000',
  default: 'http://localhost:8000',
});
const API_BASE = `${API_HOST}/api`;

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: agregar token JWT a cada request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ========== AUTH ==========
export const login = async (email, password) => {
  const res = await api.post('/staff/login', { email, password });
  await AsyncStorage.setItem('auth_token', res.data.access_token);
  await AsyncStorage.setItem('staff_data', JSON.stringify(res.data.staff));
  return res.data;
};

export const logout = async () => {
  await AsyncStorage.removeItem('auth_token');
  await AsyncStorage.removeItem('staff_data');
};

export const getStoredStaff = async () => {
  const data = await AsyncStorage.getItem('staff_data');
  return data ? JSON.parse(data) : null;
};

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

export const actualizarAuditoria = async (tareaId, auditoria_activos) => {
  const res = await api.put(`/tareas/${tareaId}/auditoria`, { auditoria_activos });
  return res.data;
};

export const subirFoto = async (tareaId, tipo, photoUri) => {
  const formData = new FormData();
  formData.append('tipo', tipo);
  formData.append('foto', {
    uri: photoUri,
    type: 'image/jpeg',
    name: `${tipo}_${Date.now()}.jpg`,
  });

  const res = await api.post(`/tareas/${tareaId}/fotos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const completarTarea = async (tareaId) => {
  const res = await api.put(`/tareas/${tareaId}/completar`);
  return res.data;
};

// ========== STAFF ==========
export const actualizarFCMToken = async (staffId, fcmToken) => {
  const res = await api.put(`/staff/${staffId}/fcm-token`, { fcm_token: fcmToken });
  return res.data;
};

export default api;
