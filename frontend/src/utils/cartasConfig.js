import { Laptop, Smartphone, Printer, Mouse } from 'lucide-react';

/** Estados de una carta responsiva (el valor real viaja en minusculas con guion bajo). */
export const ESTADOS_CARTA = {
  borrador: { label: 'Borrador', tone: 'slate' },
  generada: { label: 'Generada', tone: 'blue' },
  pendiente_firma: { label: 'Pendiente de firma', tone: 'amber' },
  firmada: { label: 'Firmada', tone: 'green' },
  cancelada: { label: 'Cancelada', tone: 'red' },
};

/** Tipos de recurso que puede cubrir una carta (coinciden con el backend). */
export const TIPOS_RECURSO = {
  EQUIPO: { label: 'Equipo de cómputo', kind: 'equipos', icon: Laptop },
  CELULAR: { label: 'Celular', kind: 'celulares', icon: Smartphone },
  IMPRESORA: { label: 'Impresora', kind: 'impresoras', icon: Printer },
  ACCESORIO: { label: 'Accesorio', kind: 'accesorios', icon: Mouse },
};

export const PLANTILLAS = {
  equipo: 'Equipo de cómputo',
  celular: 'Celular',
  impresora: 'Impresora',
  accesorio: 'Accesorios',
  general: 'Varios recursos',
};

/** Etiquetas del historial (audit_logs.action). */
export const ACCIONES_CARTA = {
  creada: 'Carta creada',
  modificada: 'Borrador modificado',
  pdf_generado: 'PDF generado',
  pdf_descargado: 'PDF descargado',
  firmada_subida: 'Carta firmada subida',
  firmada_reemplazada: 'Carta firmada reemplazada',
  firmada_descargada: 'Carta firmada descargada',
  documento_descargado: 'Documento descargado',
  cancelada: 'Carta cancelada',
};

/**
 * Filtros de tipo de recurso al elegir recursos para una carta.
 * "Monitor" y "Otro" son accesorios de ese tipo en el inventario.
 */
export const FILTROS_RECURSO = [
  { key: 'TODOS', label: 'Todos', match: () => true },
  { key: 'EQUIPO', label: 'Equipo de cómputo', match: (r) => r.categoria === 'EQUIPO' },
  { key: 'CELULAR', label: 'Celular', match: (r) => r.categoria === 'CELULAR' },
  { key: 'IMPRESORA', label: 'Impresora', match: (r) => r.categoria === 'IMPRESORA' },
  { key: 'MONITOR', label: 'Monitor', match: (r) => r.categoria === 'ACCESORIO' && r.tipo === 'Monitor' },
  { key: 'ACCESORIO', label: 'Accesorio', match: (r) => r.categoria === 'ACCESORIO' && !['Monitor', 'Otro'].includes(r.tipo) },
  { key: 'OTRO', label: 'Otro', match: (r) => r.categoria === 'ACCESORIO' && r.tipo === 'Otro' },
];
