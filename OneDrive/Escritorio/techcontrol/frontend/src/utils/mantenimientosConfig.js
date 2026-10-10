import { AlertTriangle, CalendarClock, CalendarX, CheckCircle2, Loader2, Wrench, XCircle } from 'lucide-react';

/** Tipos de mantenimiento. El icono distingue de un vistazo en el calendario. */
export const TIPOS = {
  preventivo: { label: 'Preventivo', icon: Wrench, descripcion: 'Programado para evitar fallas (limpieza, revisión, actualización).' },
  correctivo: { label: 'Correctivo', icon: AlertTriangle, descripcion: 'Para atender una falla ya reportada.' },
};

/**
 * Estados que se muestran. 'vencido' no existe en la base: lo calcula el backend
 * (programado + fecha pasada) y llega en `estado_efectivo`.
 *  - chip: colores de la etiqueta dentro del calendario
 */
export const ESTADOS = {
  programado: { label: 'Programado', tone: 'blue', icon: CalendarClock, chip: 'bg-sky-100 text-sky-800 ring-sky-600/20' },
  vencido: { label: 'Vencido', tone: 'red', icon: CalendarX, chip: 'bg-red-100 text-red-800 ring-red-600/30' },
  en_proceso: { label: 'En proceso', tone: 'amber', icon: Loader2, chip: 'bg-amber-100 text-amber-900 ring-amber-600/30' },
  realizado: { label: 'Realizado', tone: 'green', icon: CheckCircle2, chip: 'bg-emerald-100 text-emerald-800 ring-emerald-600/20' },
  reprogramado: { label: 'Reprogramado', tone: 'slate', icon: CalendarClock, chip: 'bg-slate-100 text-slate-600 ring-slate-500/20' },
  cancelado: { label: 'Cancelado', tone: 'slate', icon: XCircle, chip: 'bg-slate-100 text-slate-500 ring-slate-500/20 line-through' },
};

export const PRIORIDADES = {
  alta: { label: 'Alta', tone: 'red' },
  media: { label: 'Media', tone: 'amber' },
  baja: { label: 'Baja', tone: 'slate' },
};

/** Que se hizo con la pieza. */
export const ACCIONES_COMPONENTE = {
  reemplazado: 'Reemplazado',
  instalado: 'Instalado',
  retirado: 'Retirado',
  actualizado: 'Actualizado',
  limpiado: 'Limpiado',
  revisado: 'Revisado',
};

/** Sugerencias de componentes (el campo es libre: se puede escribir cualquiera). */
export const COMPONENTES_SUGERIDOS = [
  'RAM', 'Disco duro', 'SSD', 'Batería', 'Cargador', 'Teclado', 'Pantalla', 'Ventilador',
  'Pasta térmica', 'Fuente de poder', 'Tarjeta madre', 'Tarjeta de red', 'Tóner', 'Rodillo',
  'Cable', 'Bocinas', 'Cámara', 'Sistema operativo',
];

/** Tipos de unidad a los que se les puede agendar mantenimiento. */
export const UNIDADES = {
  EQUIPO: { label: 'Equipo', plural: 'Equipos', kind: 'equipos' },
  ACCESORIO: { label: 'Accesorio', plural: 'Accesorios', kind: 'accesorios' },
  IMPRESORA: { label: 'Impresora', plural: 'Impresoras', kind: 'impresoras' },
  CELULAR: { label: 'Celular', plural: 'Celulares', kind: 'celulares' },
};

/** Del `kind` del inventario al tipo de unidad del mantenimiento. */
export const UNIDAD_POR_KIND = Object.fromEntries(
  Object.entries(UNIDADES).map(([tipo, cfg]) => [cfg.kind, tipo])
);

/** true si todavia se puede trabajar en el mantenimiento. */
export const estaAbierto = (m) => m?.estado === 'programado' || m?.estado === 'en_proceso';

export const MONEDA = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

export const formatCosto = (valor) => (valor === null || valor === undefined ? null : MONEDA.format(valor));

/** 'HH:MM:SS' -> '9:30 a.m.' (o null si no se capturo hora). */
export function formatHora(hora) {
  if (!hora) return null;
  const [h, m] = hora.split(':');
  return new Date(2000, 0, 1, Number(h), Number(m)).toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' });
}
