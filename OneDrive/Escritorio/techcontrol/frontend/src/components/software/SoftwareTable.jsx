import { Link } from 'react-router-dom';
import { EstadoSoftwareBadge, TipoSoftwareBadge } from '../licencias/LicenciaBadges.jsx';
import PuestosBar from '../licencias/PuestosBar.jsx';
import { formatDate } from '../../utils/formatters';

/** Listado de software: tabla en escritorio, tarjetas en móvil. */
export default function SoftwareTable({ software, canVerLicencias }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="table-scroll overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {['Software', 'Fabricante', 'Tipo', 'Versión', 'Licencias', 'Próx. vencimiento', 'Estado'].map((h) => (
                  <th key={h} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {software.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/software/${s.id}`} className="font-semibold text-slate-800 hover:text-brand-500">{s.nombre}</Link>
                    {!s.requiere_licencia && <p className="text-xs text-slate-400">No requiere licencia</p>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{s.fabricante?.nombre || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3"><TipoSoftwareBadge tipo={s.tipo} /></td>
                  <td className="whitespace-nowrap px-4 py-3">{s.version_referencia || '—'}</td>
                  <td className="px-4 py-3">
                    {!canVerLicencias ? (
                      <span className="text-slate-400">—</span>
                    ) : s.licencias_total > 0 ? (
                      <PuestosBar utilizadas={s.puestos_utilizados} total={s.puestos_total} size="sm" />
                    ) : (
                      <span className="text-xs text-slate-400">Sin licencias</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {canVerLicencias && s.proximo_vencimiento ? formatDate(s.proximo_vencimiento) : '—'}
                  </td>
                  <td className="px-4 py-3"><EstadoSoftwareBadge estado={s.estado} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ul className="space-y-3 md:hidden">
        {software.map((s) => (
          <li key={s.id}>
            <Link to={`/software/${s.id}`} className="block rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-slate-800">{s.nombre}</p>
                <EstadoSoftwareBadge estado={s.estado} />
              </div>
              <p className="mt-1 text-sm text-slate-600">{s.fabricante?.nombre || 'Sin fabricante'}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <TipoSoftwareBadge tipo={s.tipo} />
                {!s.requiere_licencia && <span className="text-xs text-slate-400">No requiere licencia</span>}
              </div>
              {canVerLicencias && s.licencias_total > 0 && (
                <div className="mt-2"><PuestosBar utilizadas={s.puestos_utilizados} total={s.puestos_total} size="sm" /></div>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
