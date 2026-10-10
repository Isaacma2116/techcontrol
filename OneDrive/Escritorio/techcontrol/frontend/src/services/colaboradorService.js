import { api, API_URL, toQuery } from './api';

export const colaboradorService = {
  list: (params) => api.get(`/colaboradores${toQuery(params)}`),
  stats: () => api.get('/colaboradores/stats'),
  getById: (id) => api.get(`/colaboradores/${id}`),
  getEquipos: (id) => api.get(`/colaboradores/${id}/equipos`),
  getAccesorios: (id) => api.get(`/colaboradores/${id}/accesorios`),
  getImpresoras: (id) => api.get(`/colaboradores/${id}/impresoras`),
  getCelulares: (id) => api.get(`/colaboradores/${id}/celulares`),
  getVigentes: (id) => api.get(`/colaboradores/${id}/vigentes`),
  getHistorial: (id) => api.get(`/colaboradores/${id}/historial`),
  create: (data) => api.post('/colaboradores', data),
  update: (id, data) => api.put(`/colaboradores/${id}`, data),
  uploadFoto: (id, file) => {
    const form = new FormData();
    form.append('foto', file);
    return api.post(`/colaboradores/${id}/foto`, form);
  },
  deleteFoto: (id) => api.delete(`/colaboradores/${id}/foto`),

  /** Configuracion > Datos y respaldos (admin): alta masiva desde Excel. */
  descargarPlantillaImportacion: async () => {
    const res = await fetch(`${API_URL}/colaboradores/plantilla-importacion`, { credentials: 'include' });
    if (!res.ok) throw new Error('No se pudo descargar la plantilla.');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'plantilla-colaboradores.xlsx';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  },
  importar: (archivo) => {
    const form = new FormData();
    form.append('archivo', archivo);
    return api.post('/colaboradores/importar', form);
  },
};

/** Catalogos simples: tipo = 'areas' | 'cargos' | 'tipos-equipo' | 'tipos-accesorio' | 'tipos-impresora' | 'ubicaciones'. */
export const catalogoService = {
  list: (tipo) => api.get(`/catalogos/${tipo}`),
  create: (tipo, nombre) => api.post(`/catalogos/${tipo}`, { nombre }),
};

/** URL de la fotografia (el backend la sirve solo con sesion valida). */
export function fotoUrl(fotografia) {
  return fotografia ? `${API_URL}/uploads/colaboradores/${fotografia}` : null;
}
