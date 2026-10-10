import { api, API_URL, toQuery } from './api';

/** Dispositivos de red (routers, switches, access points, firewalls...). */
export const dispositivoRedService = {
  list: (params) => api.get(`/dispositivos-red${toQuery(params)}`),
  stats: () => api.get('/dispositivos-red/stats'),
  conexiones: () => api.get('/dispositivos-red/conexiones'),
  getById: (id) => api.get(`/dispositivos-red/${id}`),
  create: (data) => api.post('/dispositivos-red', data),
  update: (id, data) => api.put(`/dispositivos-red/${id}`, data),
  setEstado: (id, estado) => api.patch(`/dispositivos-red/${id}/estado`, { estado }),
  uploadImagen: (id, file) => {
    const form = new FormData();
    form.append('imagen', file);
    return api.post(`/dispositivos-red/${id}/imagen`, form);
  },
  deleteImagen: (id) => api.delete(`/dispositivos-red/${id}/imagen`),
  getRedes: (id) => api.get(`/dispositivos-red/${id}/redes`),
  historial: (id) => api.get(`/dispositivos-red/${id}/historial`),
  asociarRed: (id, redId) => api.post(`/dispositivos-red/${id}/redes`, { red_id: redId }),
  desasociarRed: (id, redId) => api.delete(`/dispositivos-red/${id}/redes/${redId}`),
};

/** URL de la imagen del dispositivo (el backend la sirve solo con sesion valida). */
export function dispositivoImagenUrl(imagen) {
  return imagen ? `${API_URL}/uploads/dispositivos-red/${imagen}` : null;
}
