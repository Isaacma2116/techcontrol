import { API_URL } from './api';

/**
 * Configuracion > Datos y respaldos (solo admin). La exportacion es un
 * archivo binario (igual que Reportes): no pasa por `api`, se descarga con
 * la cookie de sesion. Si el backend exige reautenticacion reciente
 * (Configuracion > Empresa > Configuracion de seguridad), responde 401 con
 * `code: 'REAUTH_REQUIRED'`: quien llama debe mostrar VerificarPasswordModal
 * y reintentar.
 */
export const datosService = {
  exportar: async () => {
    const res = await fetch(`${API_URL}/datos/exportar`, { credentials: 'include' });
    if (!res.ok) {
      let body = null;
      try { body = await res.json(); } catch { /* respuesta sin JSON */ }
      const e = new Error(body?.message || 'No se pudo exportar la información.');
      e.status = res.status;
      e.code = body?.code;
      throw e;
    }
    const blob = await res.blob();
    const match = /filename="([^"]+)"/.exec(res.headers.get('content-disposition') || '');
    const nombre = match?.[1] || 'techcontrol-datos.xlsx';

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  },
};
