import { Link } from 'react-router-dom';
import { EstadoMantenimientoBadge, PrioridadBadge, TipoMantenimientoBadge } from './MantenimientoBadges.jsx';
import { formatDate } from '../../utils/formatters';
import { formatHora } from '../../utils/mantenimientosConfig';

const unidadTexto = (m) => `${m.recurso.codigo_inventario} · ${m.recurso.titulo || m.recurso.tipo}`;

/**
 * Listado de mantenimientos: tabla en escritorio, tarjetas en movil.
 * Al hacer clic se abre el detalle (modal) para no perder los filtros.
 */
export default function MantenimientosTable({ mantenimientos, onAbrir }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="table-scroll overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {['Folio', 'Unidad', 'Tipo', 'Programado', 'Estado', 'Prioridad', 'Realizado'].map((h) => (
                  <th key={h} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {mantenimientos.map((m) => (
                <tr key={m.id} onClick={() => onAbrir(m)} className="cursor-pointer transition-colors hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-800">{m.folio}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/${m.recurso.kind}/${m.recurso.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-medium text-slate-800 hover:text-brand-500"
                    >
                      {m.recurso.codigo_inventario}
                    </Link>
                    <p className="text-xs text-slate-400">{m.recurso.titulo || m.recurso.tipo}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3"><TipoMantenimientoBadge tipo={m.tipo} /></td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {formatDate(m.fecha_programada)}
                    {m.hora_programada && <span className="text-xs text-slate-400"> · {formatHora(m.hora_programada)}</span>}
                  </td>
                  <td className="px-4 py-3"><EstadoMantenimientoBadge mantenimiento={m} /></td>
                  <td className="px-4 py-3"><PrioridadBadge prioridad={m.prioridad} /></td>
                  <td className="whitespace-nowrap px-4 py-3">{m.fecha_realizado ? formatDate(m.fecha_realizado) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ul className="space-y-3 md:hidden">
        {mantenimientos.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => onAbrir(m)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-slate-800">{m.folio}</p>
                <EstadoMantenimientoBadge mantenimiento={m} />
              </div>
              <p className="mt-1 truncate text-sm text-slate-700">{unidadTexto(m)}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <TipoMantenimientoBadge tipo={m.tipo} />
                <span className="text-xs text-slate-500">
                  {formatDate(m.fecha_programada)}
                  {m.hora_programada && ` · ${formatHora(m.hora_programada)}`}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
