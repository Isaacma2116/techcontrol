import { api } from './api';

/**
 * Usuarios del sistema. `list` tambien la usan formularios de otros modulos
 * como catalogo de responsables (ej. dispositivos de red); el resto de
 * acciones son de administracion (Configuracion > Usuarios y permisos).
 */
export const userService = {
  list: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  setEstado: (id, active) => api.patch(`/users/${id}/estado`, { active }),
  resetPassword: (id) => api.post(`/users/${id}/restablecer-password`),
  permisos: () => api.get('/users/permisos'),
};
