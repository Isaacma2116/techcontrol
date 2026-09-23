import { API_URL, toQuery } from './api';

/**
 * Reportes y Analisis: todo se calcula al vuelo en el backend (sin tabla de
 * estadisticas). `exportar` no pasa por `api` porque la respuesta es un
 * archivo binario, no JSON: se descarga con la cookie de sesion (igual que
 * los PDF de cartas responsivas).
 */
export const reporteService = {
  dashboard: async (filtros) => {
    const res = await fetch(`${API_URL}/reportes/dashboard${toQuery(filtros)}`, { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) { const e = new Error(data?.message || 'No se pudo cargar el reporte.'); e.status = res.status; throw e; }
    return data;
  },

  /** Descarga el reporte general (PDF o Excel) con los filtros actuales. */
  exportar: async (formato, filtros) => {
    const res = await fetch(`${API_URL}/reportes/exportar${toQuery({ ...filtros, formato })}`, { credentials: 'include' });
    if (!res.ok) {
      let message = 'No se pudo generar el reporte.';
      try { message = (await res.json()).message || message; } catch { /* respuesta sin JSON */ }
      const e = new Error(message); e.status = res.status; throw e;
    }
    const blob = await res.blob();
    const match = /filename="([^"]+)"/.exec(res.headers.get('content-disposition') || '');
    const nombre = match?.[1] || `reporte-general.${formato === 'excel' ? 'xlsx' : 'pdf'}`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  },
};
