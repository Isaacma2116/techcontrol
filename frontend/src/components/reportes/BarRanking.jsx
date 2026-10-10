import { formatMiles } from '../../utils/reportesConfig';

/**
 * Barras horizontales para comparar magnitud entre categorias (ranking).
 * Grosor fijo, extremo redondeado del lado del valor, cuadrado en la base;
 * el valor se etiqueta siempre al final de la barra (no hace falta tooltip
 * para verlo, pero cada barra sigue siendo el objetivo del hover/foco).
 *
 *  - `colors`: un color por barra (categorico) o un solo string (secuencial).
 */
export default function BarRanking({ data, labelKey, valueKey, colors, emptyMessage = 'Sin datos para los filtros aplicados.' }) {
  if (!data.length || data.every((d) => d[valueKey] === 0)) {
    return <p className="px-1 py-6 text-center text-sm text-slate-400">{emptyMessage}</p>;
  }

  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  const colorAt = (i) => (Array.isArray(colors) ? colors[i % colors.length] : colors);

  return (
    <div className="space-y-2.5" role="img" aria-label={`Gráfico de barras: ${data.map((d) => `${d[labelKey]} ${d[valueKey]}`).join(', ')}`}>
      {data.map((d, i) => {
        const pct = Math.max((d[valueKey] / max) * 100, d[valueKey] > 0 ? 3 : 0);
        return (
          <div key={d[labelKey]} className="group">
            <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
              <span className="truncate font-medium text-slate-700">{d[labelKey]}</span>
              <span className="shrink-0 font-semibold text-slate-800">{formatMiles(d[valueKey])}</span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100">
              <div
                title={`${d[labelKey]}: ${formatMiles(d[valueKey])}`}
                className="h-3 rounded-full transition-[filter] duration-150 group-hover:brightness-110"
                style={{ width: `${pct}%`, backgroundColor: colorAt(i) }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
