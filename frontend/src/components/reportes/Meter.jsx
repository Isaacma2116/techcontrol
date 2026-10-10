import { SEQUENTIAL, SEQUENTIAL_TRACK, formatMiles } from '../../utils/reportesConfig';

/**
 * Un solo ratio contra un limite (puestos de licencia usados / totales): un
 * medidor, no un pastel. El relleno lleva el color de marca; el track es un
 * paso mas claro de la misma rampa, asi el estado se lee de corrido.
 */
export default function Meter({ utilizadas, total }) {
  if (total === 0) {
    return <p className="px-1 py-6 text-center text-sm text-slate-400">No hay licencias activas todavía.</p>;
  }
  const pct = Math.min(100, Math.round((utilizadas / total) * 100));
  const disponibles = total - utilizadas;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-2xl font-semibold text-slate-800">{formatMiles(utilizadas)} <span className="text-sm font-normal text-slate-400">de {formatMiles(total)} puestos</span></span>
        <span className="text-sm font-medium text-slate-500">{pct}%</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full" style={{ backgroundColor: SEQUENTIAL_TRACK }} title={`${formatMiles(utilizadas)} usados de ${formatMiles(total)} · ${formatMiles(disponibles)} disponibles`}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: SEQUENTIAL }} />
      </div>
      <p className="mt-1.5 text-xs text-slate-500">{formatMiles(disponibles)} disponibles</p>
    </div>
  );
}
