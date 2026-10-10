import { api, toQuery } from './api';

/**
 * Mantenimientos preventivos y correctivos (/api/mantenimientos).
 * `list` con desde/hasta devuelve el rango completo (para el calendario);
 * sin fechas, pagina.
 */
export const mantenimientoService = {
  list: (params) => api.get(`/mantenimientos${toQuery(params)}`),
  stats: () => api.get('/mantenimientos/stats'),
  getById: (id) => api.get(`/mantenimientos/${id}`),
  create: (data) => api.post('/mantenimientos', data),
  update: (id, data) => api.put(`/mantenimientos/${id}`, data),
  iniciar: (id) => api.post(`/mantenimientos/${id}/iniciar`),
  realizar: (id, data) => api.post(`/mantenimientos/${id}/realizar`, data),
  reprogramar: (id, data) => api.post(`/mantenimientos/${id}/reprogramar`, data),
  cancelar: (id, motivo) => api.post(`/mantenimientos/${id}/cancelar`, { motivo }),
  historial: (id) => api.get(`/mantenimientos/${id}/historial`),
  /** Mantenimientos de una unidad del inventario (para su ficha). */
  porUnidad: (tipoRecurso, recursoId) =>
    api.get(`/mantenimientos${toQuery({ tipo_recurso: tipoRecurso, recurso_id: recursoId, limit: 50 })}`),
};
