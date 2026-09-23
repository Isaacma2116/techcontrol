import { api, toQuery } from './api';

/**
 * Notificaciones: cada consulta al backend tambien sincroniza (de forma
 * segura/idempotente) las alertas por fecha, asi que el panel y el contador
 * siempre reflejan el estado actual sin que el frontend tenga que pedirlo aparte.
 */
export const notificacionService = {
  list: (params) => api.get(`/notificaciones${toQuery(params)}`),
  noLeidas: () => api.get('/notificaciones/no-leidas'),
  marcarLeida: (id) => api.patch(`/notificaciones/${id}/leida`),
  marcarTodas: () => api.post('/notificaciones/marcar-todas'),
  preferencias: () => api.get('/notificaciones/preferencias'),
  guardarPreferencias: (preferencias) => api.put('/notificaciones/preferencias', { preferencias }),
};
