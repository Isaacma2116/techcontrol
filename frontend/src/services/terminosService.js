import { api, API_URL } from './api';

export const terminosService = {
  get: () => api.get('/terminos'),

  descargarPdf: async () => {
    const res = await fetch(`${API_URL}/terminos/pdf`, { credentials: 'include' });
    if (!res.ok) throw new Error('No se pudo descargar el PDF.');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'terminos-y-condiciones.pdf';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  },
};
