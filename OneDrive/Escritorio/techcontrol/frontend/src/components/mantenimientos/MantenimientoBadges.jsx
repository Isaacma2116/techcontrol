import Badge from '../ui/Badge.jsx';
import { ESTADOS, PRIORIDADES, TIPOS } from '../../utils/mantenimientosConfig';

/** Estado del mantenimiento (usa `estado_efectivo`: incluye "vencido"). */
export function EstadoMantenimientoBadge({ mantenimiento, estado }) {
  const valor = estado || mantenimiento?.estado_efectivo || mantenimiento?.estado;
  const cfg = ESTADOS[valor];
  if (!cfg) return null;
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}

/** Preventivo / correctivo, con su icono. */
export function TipoMantenimientoBadge({ tipo }) {
  const cfg = TIPOS[tipo];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-500/20">
      <Icon size={12} /> {cfg.label}
    </span>
  );
}

export function PrioridadBadge({ prioridad }) {
  const cfg = PRIORIDADES[prioridad];
  if (!cfg) return null;
  return <Badge tone={cfg.tone} dot={prioridad !== 'baja'}>Prioridad {cfg.label.toLowerCase()}</Badge>;
}
