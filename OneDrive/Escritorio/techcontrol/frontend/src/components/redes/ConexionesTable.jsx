import { Link } from 'react-router-dom';
import { EstadoDispositivoBadge, EstadoRedBadge, TipoDispositivoBadge, TipoRedBadge } from './RedesBadges.jsx';

/**
 * Todas las relaciones dispositivo<->red en una sola tabla plana. Es la base
 * logica para la futura vista de topologia (sin editor grafico por ahora).
 */
export default function ConexionesTable({ conexiones }) {
  if (conexiones.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
        <p className="text-sm text-slate-500">Todavía no hay dispositivos asociados a ninguna red.</p>
        <p className="text-xs text-slate-400">Asocia una red desde la ficha de cada dispositivo.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="table-scroll overflow-x-auto">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {['Dispositivo', 'Tipo', 'Estado', '', 'Red', 'Tipo', 'Estado'].map((h, i) => (
                <th key={i} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {conexiones.map((c) => (
              <tr key={`${c.dispositivo_id}-${c.red_id}`} className="transition-colors hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3">
                  <Link to={`/dispositivos-red/${c.dispositivo_id}`} className="font-medium text-slate-800 hover:text-brand-500">{c.dispositivo_nombre}</Link>
                  <p className="text-xs text-slate-400">{c.codigo}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3"><TipoDispositivoBadge tipo={c.dispositivo_tipo} /></td>
                <td className="whitespace-nowrap px-4 py-3"><EstadoDispositivoBadge estado={c.dispositivo_estado} /></td>
                <td className="px-2 text-slate-300">→</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <Link to={`/redes/${c.red_id}`} className="font-medium text-slate-800 hover:text-brand-500">{c.red_nombre}</Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3"><TipoRedBadge tipo={c.red_tipo} /></td>
                <td className="whitespace-nowrap px-4 py-3"><EstadoRedBadge estado={c.red_estado} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
