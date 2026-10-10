import { Link } from 'react-router-dom';
import { EstadoDispositivoBadge, TipoDispositivoBadge } from './RedesBadges.jsx';

/** Listado de dispositivos de red: tabla en escritorio, tarjetas en móvil. */
export default function DispositivosTable({ dispositivos }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="table-scroll overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {['Dispositivo', 'Tipo', 'IP', 'Ubicación', 'Redes', 'Estado'].map((h) => (
                  <th key={h} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {dispositivos.map((d) => (
                <tr key={d.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/dispositivos-red/${d.id}`} className="font-semibold text-slate-800 hover:text-brand-500">{d.nombre}</Link>
                    <p className="text-xs text-slate-400">{d.codigo}{d.marca ? ` · ${d.marca} ${d.modelo || ''}` : ''}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3"><TipoDispositivoBadge tipo={d.tipo} /></td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{d.ip_address || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3">{d.ubicacion?.nombre || '—'}</td>
                  <td className="px-4 py-3">{d.redes_total}</td>
                  <td className="px-4 py-3"><EstadoDispositivoBadge estado={d.estado} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ul className="space-y-3 md:hidden">
        {dispositivos.map((d) => (
          <li key={d.id}>
            <Link to={`/dispositivos-red/${d.id}`} className="block rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-slate-800">{d.nombre}</p>
                <EstadoDispositivoBadge estado={d.estado} />
              </div>
              <p className="mt-1 text-xs text-slate-500">{d.codigo} · {d.ubicacion?.nombre || 'Sin ubicación'}</p>
              <div className="mt-2"><TipoDispositivoBadge tipo={d.tipo} /></div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
