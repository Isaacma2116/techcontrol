import { api, API_URL, toQuery } from './api';

/**
 * Cliente de Equipos, Accesorios, Impresoras y Celulares: comparten la misma forma
 * de API (/equipos, /accesorios, /impresoras, /celulares), asi que se generan desde
 * una sola funcion. `kind` = 'equipos' | 'accesorios' | 'impresoras' | 'celulares'.
 */
function makeInventarioService(kind) {
  return {
    list: (params) => api.get(`/${kind}${toQuery(params)}`),
    stats: () => api.get(`/${kind}/stats`),
    marcas: () => api.get(`/${kind}/marcas`),
    getById: (id) => api.get(`/${kind}/${id}`),
    getHistorial: (id) => api.get(`/${kind}/${id}/historial`),
    create: (data) => api.post(`/${kind}`, data),
    update: (id, data) => api.put(`/${kind}/${id}`, data),
    setEstado: (id, estado, observaciones) => api.patch(`/${kind}/${id}/estado`, { estado, observaciones }),
    uploadImagen: (id, file) => {
      const form = new FormData();
      form.append('imagen', file);
      return api.post(`/${kind}/${id}/imagen`, form);
    },
    deleteImagen: (id) => api.delete(`/${kind}/${id}/imagen`),
    // Solo equipos monta esta ruta (KINDS.equipos.withPassword, backend); en los demas
    // tipos no se usa, ver EquipoPasswordField.jsx / MostrarPasswordEquipoModal.jsx.
    revelarPassword: (id) => api.post(`/${kind}/${id}/password`),
  };
}

export const equipoService = makeInventarioService('equipos');
export const accesorioService = makeInventarioService('accesorios');
export const impresoraService = makeInventarioService('impresoras');
export const celularService = makeInventarioService('celulares');
export const inventarioServices = {
  equipos: equipoService,
  accesorios: accesorioService,
  impresoras: impresoraService,
  celulares: celularService,
};

/** Asignar / devolver (kind = 'equipos' | 'accesorios' | 'impresoras' | 'celulares'). */
export const asignacionService = {
  // body: { equipo_id | accesorio_id | impresora_id | celular_id, colaborador_id, fecha_asignacion?, observaciones? }
  asignar: (kind, body) => api.post(`/asignaciones/${kind}`, body),
  // asignacionId = id de la ASIGNACION (no del equipo); body: { condicion, fecha_devolucion?, nuevo_estado?, observaciones? }
  devolver: (kind, asignacionId, body) => api.post(`/asignaciones/${kind}/${asignacionId}/devolver`, body),
};

/** URL de la imagen (el backend la sirve solo con sesion valida). */
export function imagenUrl(kind, imagen) {
  return imagen ? `${API_URL}/uploads/${kind}/${imagen}` : null;
}
