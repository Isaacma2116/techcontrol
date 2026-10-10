import Badge from '../ui/Badge.jsx';
import { ESTADOS_LICENCIA_EFECTIVOS, ESTADOS_SOFTWARE, TIPOS_SOFTWARE } from '../../utils/licenciasConfig';

export function EstadoLicenciaBadge({ estado }) {
  const cfg = ESTADOS_LICENCIA_EFECTIVOS[estado];
  if (!cfg) return null;
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}

export function EstadoSoftwareBadge({ estado }) {
  const cfg = ESTADOS_SOFTWARE[estado];
  if (!cfg) return null;
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}

export function TipoSoftwareBadge({ tipo }) {
  const cfg = TIPOS_SOFTWARE[tipo];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-500/20">
      <Icon size={12} /> {cfg.label}
    </span>
  );
}
