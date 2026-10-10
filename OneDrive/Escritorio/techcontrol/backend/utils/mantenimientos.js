/**
 * Definiciones compartidas del modulo de Mantenimientos.
 *
 * Un mantenimiento pertenece a UNA unidad del inventario (equipo, accesorio,
 * impresora o celular). Igual que en las cartas responsivas, cada tipo tiene su
 * propia columna con clave foranea real; `RECURSOS` traduce el tipo que llega en
 * el request al nombre de la columna. Esos nombres se interpolan en SQL, asi que
 * SOLO pueden venir de este archivo.
 */

const RECURSOS = {
  EQUIPO: { tipo: 'EQUIPO', kind: 'equipos', col: 'equipo_id', table: 'equipos', label: 'Equipo', articulo: 'El equipo' },
  ACCESORIO: { tipo: 'ACCESORIO', kind: 'accesorios', col: 'accesorio_id', table: 'accesorios', label: 'Accesorio', articulo: 'El accesorio' },
  IMPRESORA: { tipo: 'IMPRESORA', kind: 'impresoras', col: 'impresora_id', table: 'impresoras', label: 'Impresora', articulo: 'La impresora' },
  CELULAR: { tipo: 'CELULAR', kind: 'celulares', col: 'celular_id', table: 'celulares', label: 'Celular', articulo: 'El celular' },
};

const TIPOS = ['preventivo', 'correctivo'];
const PRIORIDADES = ['alta', 'media', 'baja'];

// Estados guardados. 'vencido' NO se guarda: es 'programado' con fecha pasada.
const ESTADOS = ['programado', 'en_proceso', 'realizado', 'reprogramado', 'cancelado'];
const ESTADOS_FILTRO = [...ESTADOS, 'vencido'];

// Estados desde los que todavia se puede trabajar en el mantenimiento.
const ESTADOS_ABIERTOS = ['programado', 'en_proceso'];

const ACCIONES_COMPONENTE = ['instalado', 'reemplazado', 'retirado', 'actualizado', 'limpiado', 'revisado'];

const MAX_COMPONENTES = 30;

const FOLIO_PREFIJO = 'MNT';

/** MNT-2026-000001 */
const formatFolio = (anio, consecutivo) => `${FOLIO_PREFIJO}-${anio}-${String(consecutivo).padStart(6, '0')}`;

/** Fecha 'YYYY-MM-DD' de hoy en hora LOCAL (no UTC: no debe correrse un dia). */
function hoyISO(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Estado que se muestra: agrega 'vencido' (programado y ya paso la fecha).
 * Se calcula igual en SQL (para filtrar) y aqui (para respuestas armadas en JS).
 */
function estadoEfectivo(estado, fechaProgramada, hoy = hoyISO()) {
  return estado === 'programado' && fechaProgramada && fechaProgramada < hoy ? 'vencido' : estado;
}

module.exports = {
  RECURSOS,
  TIPOS,
  PRIORIDADES,
  ESTADOS,
  ESTADOS_FILTRO,
  ESTADOS_ABIERTOS,
  ACCIONES_COMPONENTE,
  MAX_COMPONENTES,
  FOLIO_PREFIJO,
  formatFolio,
  hoyISO,
  estadoEfectivo,
};
