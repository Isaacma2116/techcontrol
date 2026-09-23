import Badge from '../ui/Badge.jsx';
import { ESTADOS_DISPOSITIVO, ESTADOS_RED, TIPOS_DISPOSITIVO, TIPOS_RED } from '../../utils/redesConfig';

export function EstadoRedBadge({ estado }) {
  const cfg = ESTADOS_RED[estado];
  if (!cfg) return null;
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}

export function EstadoDispositivoBadge({ estado }) {
  const cfg = ESTADOS_DISPOSITIVO[estado];
  if (!cfg) return null;
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}

export function TipoRedBadge({ tipo }) {
  const cfg = TIPOS_RED[tipo];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-500/20">
      <Icon size={12} /> {cfg.label}
    </span>
  );
}

export function TipoDispositivoBadge({ tipo }) {
  const cfg = TIPOS_DISPOSITIVO[tipo];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-500/20">
      <Icon size={12} /> {cfg.label}
    </span>
  );
}
