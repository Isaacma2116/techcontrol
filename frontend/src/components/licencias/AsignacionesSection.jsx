import { Link } from 'react-router-dom';
import { Repeat, UserMinus, Users } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { SectionCard, EmptyState } from '../ui/SectionCard.jsx';
import Avatar from '../ui/Avatar.jsx';
import { formatDateTime } from '../../utils/formatters';

function Destino({ asignacion }) {
  if (asignacion.colaborador) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <Avatar size="sm" nombre={asignacion.colaborador.nombre_completo} src={null} />
        <div className="min-w-0">
          <Link to={`/colaboradores/${asignacion.colaborador.id}`} className="truncate font-medium text-slate-800 hover:text-brand-500">
            {asignacion.colaborador.nombre_completo}
          </Link>
          <p className="text-xs text-slate-400">{asignacion.colaborador.id_empleado}</p>
        </div>
      </div>
    );
  }
  if (asignacion.equipo) {
    return (
      <Link to={`/equipos/${asignacion.equipo.id}`} className="font-medium text-slate-800 hover:text-brand-500">
        {asignacion.equipo.codigo_inventario} <span className="font-normal text-slate-500">· {asignacion.equipo.titulo}</span>
      </Link>
    );
  }
  return <span className="text-slate-400">—</span>;
}

/** Puestos vigentes (con acciones) e historial de una licencia. */
export default function AsignacionesSection({ asignaciones, canGestionar, onLiberar, onTransferir }) {
  const vigentes = asignaciones.filter((a) => a.estado === 'activa');
  const historial = asignaciones.filter((a) => a.estado !== 'activa');

  return (
    <SectionCard title="Asignaciones" description="Quién tiene hoy un puesto de esta licencia." count={vigentes.length}>
      {vigentes.length === 0 ? (
        <EmptyState icon={Users} message="Ningún puesto asignado todavía." />
      ) : (
        <ul className="divide-y divide-slate-100">
          {vigentes.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <Destino asignacion={a} />
                {a.colaborador && a.equipo && (
                  <p className="mt-0.5 text-xs text-slate-400">
                    Equipo: {a.equipo.codigo_inventario} · {a.equipo.titulo}
                  </p>
                )}
                <p className="mt-0.5 text-xs text-slate-400">Desde {formatDateTime(a.fecha_asignacion)}</p>
              </div>
              {canGestionar && (
                <div className="flex gap-2">
                  <Button variant="secondary" icon={Repeat} onClick={() => onTransferir(a)}>Transferir</Button>
                  <Button variant="secondary" icon={UserMinus} onClick={() => onLiberar(a)}>Liberar</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {historial.length > 0 && (
        <div className="border-t border-slate-100 px-5 py-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Historial</h4>
          <ul className="space-y-2">
            {historial.map((a) => (
              <li key={a.id} className="text-xs text-slate-500">
                <span className="font-medium text-slate-700">
                  {a.colaborador?.nombre_completo || a.equipo?.codigo_inventario || '—'}
                </span>{' '}
                · {formatDateTime(a.fecha_asignacion)} → {formatDateTime(a.fecha_liberacion)}
                {a.observaciones_liberacion && <span> · {a.observaciones_liberacion}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </SectionCard>
  );
}
