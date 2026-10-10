import {
  AlertTriangle, Archive, Ban, Box, Boxes, Code2, Gift, ShieldOff, XCircle,
} from 'lucide-react';

/** Tipo de software. */
export const TIPOS_SOFTWARE = {
  comercial: { label: 'Comercial', icon: Box },
  gratuito: { label: 'Gratuito', icon: Gift },
  open_source: { label: 'Código abierto', icon: Code2 },
  freeware: { label: 'Freeware', icon: Gift },
  interno: { label: 'Desarrollo interno', icon: Boxes },
  otro: { label: 'Otro', icon: Box },
};

export const ESTADOS_SOFTWARE = {
  activo: { label: 'Activo', tone: 'green' },
  descontinuado: { label: 'Descontinuado', tone: 'slate' },
  no_permitido: { label: 'No permitido', tone: 'red', icon: Ban },
};

/** Estado EFECTIVO de una licencia (activa/suspendida/cancelada + calculado: vencida/agotada/por_vencer). */
export const ESTADOS_LICENCIA_EFECTIVOS = {
  activa: { label: 'Activa', tone: 'green' },
  por_vencer: { label: 'Por vencer', tone: 'amber', icon: AlertTriangle },
  vencida: { label: 'Vencida', tone: 'red', icon: XCircle },
  agotada: { label: 'Sin puestos libres', tone: 'amber', icon: Archive },
  suspendida: { label: 'Suspendida', tone: 'slate', icon: ShieldOff },
  cancelada: { label: 'Cancelada', tone: 'slate', icon: Ban },
};

// Solo estos se pueden fijar a mano (el resto los calcula el backend).
export const ESTADOS_LICENCIA_MANUALES = ['activa', 'suspendida', 'cancelada'];

export const PERIODICIDADES = {
  unica: 'Pago único',
  mensual: 'Mensual',
  anual: 'Anual',
  bianual: 'Cada 2 años',
  otro: 'Otra',
};

export const AMBITO_LABEL = {
  usuario: 'Por usuario',
  dispositivo: 'Por dispositivo',
  ambos: 'Usuario y/o equipo',
};

/** Umbrales de alerta de vencimiento (dias). Mismo valor que utils/licencias.js del backend. */
export const ALERTA_VENCIMIENTO_DIAS = [90, 60, 30, 7];

/** Texto y urgencia segun los dias que faltan para vencer (o si ya venció). */
export function alertaVencimiento(dias) {
  if (dias === null || dias === undefined) return null;
  if (dias < 0) return { label: 'Vencida', tone: 'red', urgente: true };
  const umbral = ALERTA_VENCIMIENTO_DIAS.find((d) => dias <= d);
  if (!umbral) return null; // falta mucho: no se resalta
  return {
    label: dias === 0 ? 'Vence hoy' : `Vence en ${dias} ${dias === 1 ? 'día' : 'días'}`,
    tone: umbral <= 7 ? 'red' : umbral <= 30 ? 'amber' : 'blue',
    urgente: umbral <= 30,
  };
}

const MONEDA_FMT = {};
export function formatCosto(valor, moneda = 'MXN') {
  if (valor === null || valor === undefined) return null;
  if (!MONEDA_FMT[moneda]) {
    try {
      MONEDA_FMT[moneda] = new Intl.NumberFormat('es-MX', { style: 'currency', currency: moneda });
    } catch {
      MONEDA_FMT[moneda] = new Intl.NumberFormat('es-MX', { style: 'decimal', minimumFractionDigits: 2 });
    }
  }
  return MONEDA_FMT[moneda].format(valor);
}
