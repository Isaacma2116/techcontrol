import { api, API_URL } from './api';

/** Perfil y seguridad de la cuenta del usuario autenticado (/api/perfil). */
export const perfilService = {
  get: () => api.get('/perfil'),
  update: (data) => api.put('/perfil', data),
  changePassword: (data) => api.put('/perfil/password', data),
  updatePreferencias: (data) => api.put('/perfil/preferencias', data),
  verificarPassword: (password) => api.post('/perfil/verificar-password', { password }),
  uploadFoto: (file) => {
    const form = new FormData();
    form.append('foto', file);
    return api.post('/perfil/foto', form);
  },
  deleteFoto: () => api.delete('/perfil/foto'),
  sesiones: () => api.get('/perfil/sesiones'),
  closeSesion: (id) => api.delete(`/perfil/sesiones/${id}`),
  closeOtras: () => api.delete('/perfil/sesiones/otras'),
  eliminarCuenta: (data) => api.delete('/perfil', data),
};

/** URL de la foto de perfil (el backend la sirve solo con sesion valida). */
export function perfilFotoUrl(foto) {
  return foto ? `${API_URL}/uploads/usuarios/${foto}` : null;
}
