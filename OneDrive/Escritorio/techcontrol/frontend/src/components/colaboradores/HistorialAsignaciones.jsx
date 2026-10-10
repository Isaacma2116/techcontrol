import { Link } from 'react-router-dom';
import { History } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import { SectionCard, EmptyState } from '../ui/SectionCard.jsx';
import TipoItem from '../inventario/TipoItem.jsx';
import { CONDICIONES, KINDS } from '../../utils/inventarioConfig';
import { formatDate } from '../../utils/formatters';

const KIND_BY_CATEGORIA = { EQUIPO: 'equipos', ACCESORIO: 'accesorios', IMPRESORA: 'impresoras', CELULAR: 'celulares' };

function EstadoAsignacion({ item }) {
  if (item.vigente) return <Badge tone="green">Vigente</Badge>;

  const tone = item.condicion_devolucion === 'danado' || item.condicion_devolucion === 'perdido' ? 'amber' : 'slate';
  return (
    <div className="flex flex-col items-start gap-0.5">
      <Badge tone={tone}>Devuelto</Badge>
      {item.condicion_devolucion && (
        <span className="text-xs text-slate-400">{CONDICIONES[item.condicion_devolucion]}</span>
      )}
    </div>
  );
}

/**
 * Historial completo de equipos, accesorios, impresoras y celulares (vigentes y devueltos). Cada fila
 * trae codigo, serie, quien entrego/recibio y observaciones, de modo que se
 * pueda generar una carta responsiva a partir de ella.
 */
export default function HistorialAsignaciones({ historial, loading, error }) {
  return (
    <SectionCard
      title="Historial de asignaciones"
      description="Equipos, accesorios, impresoras y celulares que ha tenido, con sus fechas de entrega y devolución."
      count={loading || error ? undefined : historial.length}
    >
      {loading ? (
        <p className="px-5 py-8 text-center text-sm text-slate-400">Cargando historial…</p>
      ) : error ? (
        <p className="px-5 py-8 text-center text-sm text-red-600">{error}</p>
      ) : historial.length === 0 ? (
        <EmptyState icon={History} message="Aún no hay asignaciones registradas para este colaborador." />
      ) : (
        <div className="table-scroll overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {['Elemento', 'Fecha asignación', 'Fecha devolución', 'Estado'].map((h) => (
                  <th key={h} scope="col" className="whitespace-nowrap px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {historial.map((h) => {
                const kind = KIND_BY_CATEGORIA[h.categoria];
                return (
                  <tr key={`${h.categoria}-${h.asignacion_id}`}>
                    <td className="px-5 py-3">
                      <TipoItem tipo={h.tipo} />
                      <p className="mt-0.5 pl-6 text-xs text-slate-400">
                        {h.descripcion && `${h.descripcion} · `}
                        <Link to={`${KINDS[kind].basePath}/${h.item_id}`} className="hover:text-brand-500">
                          {h.codigo_inventario}
                        </Link>
                        {!h.numero_serie && ' · Sin número de serie'}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">{formatDate(h.fecha_asignacion)}</td>
                    <td className="whitespace-nowrap px-5 py-3">{h.vigente ? '—' : formatDate(h.fecha_devolucion)}</td>
                    <td className="px-5 py-3"><EstadoAsignacion item={h} /></td>
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
