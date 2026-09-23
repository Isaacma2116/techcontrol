/**
 * Paleta de los graficos de Reportes.
 *  - Categorica: 5 tonos validados (orden fijo, nunca se reordenan; ver
 *    /dataviz skill: CVD Delta E >= 8, contraste con etiquetas directas como
 *    mitigacion donde el tono es claro). El primero es el azul de marca.
 *  - Secuencial: el mismo azul de marca, para graficos de "ranking" donde el
 *    dato es magnitud (por departamento/ubicacion/tipo), no identidad.
 *  - Estado: reutiliza los tonos que ya usan las insignias (Badge.jsx) en
 *    todo el sistema (verde/ambar/rojo/slate), para no introducir un segundo
 *    lenguaje de color para "bueno/atencion/critico".
 */
export const CATEGORICAL = ['#2563eb', '#f97316', '#14b8a6', '#8b5cf6', '#ec4899'];
export const SEQUENTIAL = '#2563eb';
export const SEQUENTIAL_TRACK = '#dbeafe';

export const ESTADO_COLOR = { good: '#059669', warning: '#f59e0b', critical: '#dc2626', neutral: '#94a3b8' };

export const TIPO_ACTIVO_LABEL = { equipos: 'Equipos', accesorios: 'Accesorios', impresoras: 'Impresoras', celulares: 'Celulares' };

export const ESTADOS_ACTIVO = {
  disponible: 'Disponible', asignado: 'Asignado', mantenimiento: 'Mantenimiento',
  reparacion: 'Reparación', baja: 'Baja', perdido: 'Perdido',
};

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
/** 'YYYY-MM' -> "sep 2026" */
export function formatPeriodo(periodo) {
  const [anio, mes] = periodo.split('-');
  return `${MESES[Number(mes) - 1]} ${anio}`;
}

export function formatMiles(n) {
  return new Intl.NumberFormat('es-MX').format(n);
}
