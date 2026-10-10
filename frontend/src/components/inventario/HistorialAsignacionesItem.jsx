import { Link } from 'react-router-dom';
import { History } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import { SectionCard, EmptyState } from '../ui/SectionCard.jsx';
import { CONDICIONES } from '../../utils/inventarioConfig';
import { formatDate } from '../../utils/formatters';

/**
 * Historial de un equipo/accesorio: todas las personas que lo han tenido,
 * con fecha de asignacion y devolucion (base de las cartas responsivas).
 */
export default function HistorialAsignacionesItem({ historial, loading, error, canManage }) {
  return (
    <SectionCard
      title="Historial de asignaciones"
      description="Todas las personas que han tenido este elemento."
      count={loading || error ? undefined : historial.length}
    >
      {loading ? (
        <p className="px-5 py-8 text-center text-sm text-slate-400">Cargando historial…</p>
      ) : error ? (
        <p className="px-5 py-8 text-center text-sm text-red-600">{error}</p>
      ) : historial.length === 0 ? (
        <EmptyState icon={History} message="Aún no se ha asignado a nadie." />
      ) : (
        <div className="table-scroll overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {['Colaborador', 'Fecha asignación', 'Fecha devolución', 'Estado', 'Observaciones'].map((h) => (
                  <th key={h} scope="col" className="whitespace-nowrap px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {historial.map((h) => {
                const vigente = h.estado === 'activa';
                return (
                  <tr key={h.asignacion_id} className="align-top">
                    <td className="px-5 py-3">
                      {canManage ? (
                        <Link to={`/colaboradores/${h.colaborador_id}`} className="font-medium text-slate-800 hover:text-brand-500">
                          {h.colaborador_nombre}
                        </Link>
                      ) : (
                        <span className="font-medium text-slate-800">{h.colaborador_nombre}</span>
                      )}
                      <p className="text-xs text-slate-400">{h.id_empleado}</p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">{formatDate(h.fecha_asignacion)}</td>
                    <td className="whitespace-nowrap px-5 py-3">{vigente ? '—' : formatDate(h.fecha_devolucion)}</td>
                    <td className="px-5 py-3">
                      {vigente ? (
                        <Badge tone="green">Vigente</Badge>
                      ) : (
                        <div className="flex flex-col items-start gap-0.5">
                          <Badge tone={h.condicion_devolucion === 'danado' || h.condicion_devolucion === 'perdido' ? 'amber' : 'slate'}>
                            Devuelto
                          </Badge>
                          {h.condicion_devolucion && (
                            <span className="text-xs text-slate-400">{CONDICIONES[h.condicion_devolucion]}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="max-w-xs px-5 py-3 text-xs text-slate-500">
                      {h.observaciones_asignacion && <p>Entrega: {h.observaciones_asignacion}</p>}
                      {h.observaciones_devolucion && <p>Devolución: {h.observaciones_devolucion}</p>}
                      {!h.observaciones_asignacion && !h.observaciones_devolucion && '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
