import { Link } from 'react-router-dom';
import { EstadoLicenciaBadge } from './LicenciaBadges.jsx';
import PuestosBar from './PuestosBar.jsx';
import { formatDate } from '../../utils/formatters';
import { formatCosto } from '../../utils/licenciasConfig';

/** Listado de licencias: tabla en escritorio, tarjetas en móvil. */
export default function LicenciasTable({ licencias, verCostos }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="table-scroll overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {['Licencia', 'Software', 'Modelo', 'Puestos', 'Vencimiento', ...(verCostos ? ['Costo'] : []), 'Estado'].map((h) => (
                  <th key={h} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {licencias.map((l) => (
                <tr key={l.id} className="transition-colors hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link to={`/licencias/${l.id}`} className="font-semibold text-slate-800 hover:text-brand-500">{l.codigo}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/software/${l.software.id}`} className="text-slate-800 hover:text-brand-500">{l.software.nombre}</Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{l.modelo.nombre}</td>
                  <td className="px-4 py-3"><PuestosBar utilizadas={l.utilizadas} total={l.cantidad_total} size="sm" /></td>
                  <td className="whitespace-nowrap px-4 py-3">{l.fecha_vencimiento ? formatDate(l.fecha_vencimiento) : 'Sin vencimiento'}</td>
                  {verCostos && <td className="whitespace-nowrap px-4 py-3">{formatCosto(l.costo, l.moneda) || '—'}</td>}
                  <td className="px-4 py-3"><EstadoLicenciaBadge estado={l.estado_efectivo} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ul className="space-y-3 md:hidden">
        {licencias.map((l) => (
          <li key={l.id}>
            <Link to={`/licencias/${l.id}`} className="block rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-slate-800">{l.codigo}</p>
                <EstadoLicenciaBadge estado={l.estado_efectivo} />
              </div>
              <p className="mt-1 text-sm text-slate-700">{l.software.nombre}</p>
              <p className="text-xs text-slate-400">{l.modelo.nombre} · {l.fecha_vencimiento ? formatDate(l.fecha_vencimiento) : 'sin vencimiento'}</p>
              <div className="mt-2"><PuestosBar utilizadas={l.utilizadas} total={l.cantidad_total} size="sm" /></div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
