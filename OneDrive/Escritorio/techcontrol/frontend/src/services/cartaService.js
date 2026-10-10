import { api, API_URL, toQuery } from './api';

/** Cliente de Cartas Responsivas y de los datos de la empresa. */
export const cartaService = {
  list: (params) => api.get(`/cartas-responsivas${toQuery(params)}`),
  stats: () => api.get('/cartas-responsivas/stats'),
  getById: (id) => api.get(`/cartas-responsivas/${id}`),
  getHistorial: (id) => api.get(`/cartas-responsivas/${id}/historial`),
  create: (data) => api.post('/cartas-responsivas', data),
  update: (id, data) => api.put(`/cartas-responsivas/${id}`, data),
  generar: (id) => api.post(`/cartas-responsivas/${id}/generar`),
  cancelar: (id, motivo) => api.post(`/cartas-responsivas/${id}/cancelar`, { motivo }),
  subirFirmada: (id, file, fechaFirma) => {
    const form = new FormData();
    form.append('archivo', file);
    if (fechaFirma) form.append('fecha_firma', fechaFirma);
    return api.post(`/cartas-responsivas/${id}/firmada`, form);
  },

  // Documentos (Blob): PDF de vista previa (borrador), PDF generado, firmada y versiones.
  previewBlob: (id) => api.blob(`/cartas-responsivas/${id}/preview`),
  // descargar = true registra la descarga (y pasa la carta a "pendiente de firma" la primera vez).
  pdfBlob: (id, descargar = false) => api.blob(`/cartas-responsivas/${id}/pdf${descargar ? '?descargar=1' : ''}`),
  firmadaBlob: (id) => api.blob(`/cartas-responsivas/${id}/firmada`),
  documentoBlob: (id, docId) => api.blob(`/cartas-responsivas/${id}/documentos/${docId}`),
};

export const empresaService = {
  get: () => api.get('/empresa'),
  update: (data) => api.put('/empresa', data),
  uploadLogo: (file) => {
    const form = new FormData();
    form.append('logo', file);
    return api.post('/empresa/logo', form);
  },
  deleteLogo: () => api.delete('/empresa/logo'),
  updatePoliticaSeguridad: (requiereReautenticacion) =>
    api.patch('/empresa/politica-seguridad', { requiere_reautenticacion_sensible: requiereReautenticacion }),
};

/** URL del logo (el backend lo sirve solo con sesion). `version` refresca la vista previa al cambiarlo. */
export function logoUrl(version) {
  return version ? `${API_URL}/empresa/logo?v=${version}` : null;
}
