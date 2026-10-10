import { api, toQuery } from './api';

/** Redes (Wi-Fi, LAN, VLAN, invitados, servidores...). */
export const redService = {
  list: (params) => api.get(`/redes${toQuery(params)}`),
  listAll: () => api.get('/redes/todas'),
  stats: () => api.get('/redes/stats'),
  getById: (id) => api.get(`/redes/${id}`),
  create: (data) => api.post('/redes', data),
  update: (id, data) => api.put(`/redes/${id}`, data),
  setEstado: (id, estado) => api.patch(`/redes/${id}/estado`, { estado }),
  // Sin contraseña en el body: el permiso alcanza, salvo que la empresa pida
  // confirmarla de nuevo (401 REAUTH_REQUIRED — ver MostrarPasswordModal.jsx).
  revelarPassword: (id) => api.post(`/redes/${id}/password`),
  getDispositivos: (id) => api.get(`/redes/${id}/dispositivos`),
  historial: (id) => api.get(`/redes/${id}/historial`),
};
