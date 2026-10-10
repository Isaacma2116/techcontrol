import { Link } from 'react-router-dom';
import { Building2, Briefcase } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import { EstadoBadge } from '../ui/Badge.jsx';
import { fotoUrl } from '../../services/colaboradorService';

/** Tarjeta resumida del listado: solo lo esencial; el detalle vive en el perfil. */
export default function ColaboradorCard({ colaborador: c }) {
  return (
    <Link
      to={`/colaboradores/${c.id}`}
      className="group flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-brand-500/40 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
    >
      <div className="flex items-start gap-3">
        <Avatar src={fotoUrl(c.fotografia)} nombre={c.nombre} apellido={c.apellido_paterno} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-slate-800 group-hover:text-brand-500">
            {c.nombre_completo}
          </h3>
          <p className="mt-0.5 text-xs font-medium text-slate-400">{c.id_empleado}</p>
          <div className="mt-2">
            <EstadoBadge activo={c.activo} />
          </div>
        </div>
      </div>

      <dl className="space-y-1.5 border-t border-slate-100 pt-3 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <Building2 size={14} className="shrink-0 text-slate-400" />
          <dt className="sr-only">Área</dt>
          <dd className="truncate">{c.area}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Briefcase size={14} className="shrink-0 text-slate-400" />
          <dt className="sr-only">Cargo</dt>
          <dd className="truncate">{c.cargo}</dd>
        </div>
      </dl>
    </Link>
  );
}

export function ColaboradorCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="h-16 w-16 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3.5 w-3/4 rounded bg-slate-200" />
          <div className="h-3 w-1/3 rounded bg-slate-100" />
          <div className="h-5 w-16 rounded-full bg-slate-100" />
        </div>
      </div>
      <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
        <div className="h-3 w-2/3 rounded bg-slate-100" />
        <div className="h-3 w-1/2 rounded bg-slate-100" />
      </div>
    </div>
  );
}
