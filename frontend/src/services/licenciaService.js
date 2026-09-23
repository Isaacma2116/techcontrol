import { api, toQuery } from './api';

/** Licencias: cada contrato/compra de un software, con sus puestos y asignaciones. */
export const licenciaService = {
  list: (params) => api.get(`/licencias${toQuery(params)}`),
  stats: () => api.get('/licencias/stats'),
  getById: (id) => api.get(`/licencias/${id}`),
  create: (data) => api.post('/licencias', data),
  update: (id, data) => api.put(`/licencias/${id}`, data),
  setEstado: (id, estado) => api.patch(`/licencias/${id}/estado`, { estado }),
  renovar: (id, data) => api.post(`/licencias/${id}/renovar`, data),
  getAsignaciones: (id) => api.get(`/licencias/${id}/asignaciones`),
  asignar: (id, data) => api.post(`/licencias/${id}/asignaciones`, data),
  liberar: (id, asignacionId, observaciones) => api.post(`/licencias/${id}/asignaciones/${asignacionId}/liberar`, { observaciones }),
  transferir: (id, asignacionId, data) => api.post(`/licencias/${id}/asignaciones/${asignacionId}/transferir`, data),
  historial: (id) => api.get(`/licencias/${id}/historial`),
};

export const proveedorService = {
  list: (params) => api.get(`/proveedores${toQuery(params)}`),
  getById: (id) => api.get(`/proveedores/${id}`),
  create: (data) => api.post('/proveedores', data),
  update: (id, data) => api.put(`/proveedores/${id}`, data),
  setActivo: (id, activo) => api.patch(`/proveedores/${id}/activo`, { activo }),
};
