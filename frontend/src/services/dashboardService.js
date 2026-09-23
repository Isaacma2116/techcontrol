import { api } from './api';

/**
 * Dashboard principal: una sola llamada que trae todo lo que ya calcula el
 * backend en SQL (tarjetas, alertas, listas de pendientes y actividad
 * reciente). El contenido cambia segun el rol de quien lo pide; el backend
 * decide que se omite, el frontend solo muestra lo que llega.
 */
export const dashboardService = {
  get: () => api.get('/dashboard'),
};
