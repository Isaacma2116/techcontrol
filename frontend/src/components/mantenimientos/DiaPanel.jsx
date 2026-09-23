import { CalendarPlus, CalendarRange } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { EstadoMantenimientoBadge, PrioridadBadge, TipoMantenimientoBadge } from './MantenimientoBadges.jsx';
import { fechaLarga } from '../../utils/calendario';
import { formatHora } from '../../utils/mantenimientosConfig';

/** Mantenimientos del dia elegido en el calendario. */
export default function DiaPanel({ dia, mantenimientos, onAbrir, onAgendar, canManage }) {
  if (!dia) {
    return (
      <section className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
        <CalendarRange size={26} className="text-slate-300" />
        <p className="text-sm text-slate-500">Elige un día del calendario para ver lo que está agendado.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{fechaLarga(dia)}</h3>
          <p className="text-xs text-slate-500">
            {mantenimientos.length
              ? `${mantenimientos.length} ${mantenimientos.length === 1 ? 'unidad agendada' : 'unidades agendadas'}`
              : 'Sin mantenimientos este día'}
          </p>
        </div>
        {canManage && (
          <Button variant="secondary" icon={CalendarPlus} onClick={() => onAgendar(dia)}>Agendar en este día</Button>
        )}
      </div>

      {mantenimientos.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-slate-500">
          No hay nada programado. {canManage ? 'Puedes agendar un mantenimiento para este día.' : ''}
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {mantenimientos.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => onAbrir(m)}
                className="flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-slate-50"
              >
                <div className="w-16 shrink-0 text-xs font-semibold text-slate-500">
                  {formatHora(m.hora_programada) || 'Sin hora'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {m.recurso.codigo_inventario} <span className="font-normal text-slate-600">· {m.recurso.titulo || m.recurso.tipo}</span>
                  </p>
                  {m.motivo && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{m.motivo}</p>}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <TipoMantenimientoBadge tipo={m.tipo} />
                    <EstadoMantenimientoBadge mantenimiento={m} />
                    {m.prioridad === 'alta' && <PrioridadBadge prioridad={m.prioridad} />}
                  </div>
                </div>
                <span className="shrink-0 text-xs font-medium text-slate-400">{m.folio}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
