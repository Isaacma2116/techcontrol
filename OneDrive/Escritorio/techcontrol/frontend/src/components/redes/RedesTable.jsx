import { Link } from 'react-router-dom';
import { EstadoRedBadge, TipoRedBadge } from './RedesBadges.jsx';

/** Listado de redes: tabla en escritorio, tarjetas en móvil. */
export default function RedesTable({ redes }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="table-scroll overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {['Red', 'Tipo', 'Ubicación', 'Rango IP', 'Dispositivos', 'Estado'].map((h) => (
                  <th key={h} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {redes.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/redes/${r.id}`} className="font-semibold text-slate-800 hover:text-brand-500">{r.nombre}</Link>
                    {r.vlan_numero && <p className="text-xs text-slate-400">VLAN {r.vlan_numero}</p>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3"><TipoRedBadge tipo={r.tipo} /></td>
                  <td className="whitespace-nowrap px-4 py-3">{r.ubicacion?.nombre || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{r.rango_ip || '—'}</td>
                  <td className="px-4 py-3">{r.dispositivos_total}</td>
                  <td className="px-4 py-3"><EstadoRedBadge estado={r.estado} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ul className="space-y-3 md:hidden">
        {redes.map((r) => (
          <li key={r.id}>
            <Link to={`/redes/${r.id}`} className="block rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-slate-800">{r.nombre}</p>
                <EstadoRedBadge estado={r.estado} />
              </div>
              <p className="mt-1 text-xs text-slate-500">{r.ubicacion?.nombre || 'Sin ubicación'} · {r.dispositivos_total} dispositivo(s)</p>
              <div className="mt-2"><TipoRedBadge tipo={r.tipo} /></div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
