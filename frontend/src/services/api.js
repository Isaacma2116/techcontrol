/**
 * Cliente HTTP base. `credentials: 'include'` es indispensable:
 * es lo que hace que el navegador envie/reciba la cookie HttpOnly
 * del JWT en cada request al backend.
 */
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const SESSION_EXPIRED_EVENT = 'tc:session-expired';

async function request(path, { method = 'GET', body, headers } = {}) {
  // FormData (subida de archivos): el navegador define el Content-Type con su boundary.
  const isForm = body instanceof FormData;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: 'include',
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = data?.message || 'Ocurrio un error inesperado.';
    const error = new Error(message);
    error.status = res.status;
    error.errors = data?.errors; // errores por campo ({ campo: mensaje }), si el backend los envia
    error.code = data?.code; // p. ej. 'REAUTH_REQUIRED': un 401 que NO significa "sesion invalida"
    // Sesion cerrada o revocada (p. ej. desde otro dispositivo): AuthContext vuelve al login.
    // REAUTH_REQUIRED es un 401 distinto (confirmar contraseña para datos sensibles): no cierra la sesion.
    if (res.status === 401 && error.code !== 'REAUTH_REQUIRED' && !path.startsWith('/auth/')) {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    throw error;
  }

  return data;
}

/**
 * Descarga un archivo (PDF, imagen) como Blob, con la cookie de sesion.
 * Sirve para vistas previas y descargas de documentos protegidos: el navegador no
 * puede usar un <iframe>/<a> directo porque la API vive en otro origen.
 */
async function requestBlob(path) {
  const res = await fetch(`${API_URL}${path}`, { credentials: 'include' });
  if (!res.ok) {
    let message = 'No se pudo descargar el archivo.';
    let code;
    try {
      const body = await res.json();
      message = body.message || message;
      code = body.code;
    } catch {
      /* respuesta sin JSON */
    }
    const error = new Error(message);
    error.status = res.status;
    error.code = code;
    throw error;
  }
  return res.blob();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path, body) => request(path, { method: 'DELETE', body }),
  blob: requestBlob,
};

/** Convierte { a: 1, b: '', c: undefined } en '?a=1' ignorando valores vacios. */
export function toQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') qs.set(key, value);
  });
  const str = qs.toString();
  return str ? `?${str}` : '';
}
