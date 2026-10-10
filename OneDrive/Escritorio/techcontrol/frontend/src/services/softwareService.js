import { api, toQuery } from './api';

/** Software: el programa (AutoCAD, Chrome…), no una licencia especifica. */
export const softwareService = {
  list: (params) => api.get(`/software${toQuery(params)}`),
  stats: () => api.get('/software/stats'),
  getById: (id) => api.get(`/software/${id}`),
  getLicencias: (id) => api.get(`/software/${id}/licencias`),
  getUsuarios: (id) => api.get(`/software/${id}/usuarios`),
  create: (data) => api.post('/software', data),
  update: (id, data) => api.put(`/software/${id}`, data),
  setEstado: (id, estado) => api.patch(`/software/${id}/estado`, { estado }),
};
