import { useState } from 'react';
import { CATEGORICAL, formatMiles, formatPeriodo } from '../../utils/reportesConfig';

const COLOR_PREVENTIVO = CATEGORICAL[0]; // azul de marca
const COLOR_CORRECTIVO = CATEGORICAL[1]; // naranja

const W = 640;
const H = 220;
const PAD = { top: 10, right: 10, bottom: 28, left: 32 };

/**
 * Mantenimientos por periodo, preventivo vs correctivo: barras agrupadas por
 * mes. Dos series -> siempre con leyenda (no solo color). Grosor <= 24px,
 * extremo superior redondeado, separacion de 2px entre barras del mismo grupo.
 */
export default function MantenimientosChart({ data }) {
  const [hover, setHover] = useState(null);

  if (!data.length) {
    return <p className="px-1 py-10 text-center text-sm text-slate-400">Sin mantenimientos registrados en este periodo.</p>;
  }

  const max = Math.max(...data.flatMap((d) => [d.preventivos, d.correctivos]), 1);
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const groupW = plotW / data.length;
  const barW = Math.min(22, groupW / 2.6);
  const gap = 2;
  const y = (v) => plotH - (v / max) * plotH;
  const ticks = [0, 0.5, 1].map((f) => Math.round(max * f));

  return (
    <div>
      <div className="mb-2 flex items-center gap-4 text-xs">
        <span className="inline-flex items-center gap-1.5 text-slate-600"><span className="h-2 w-3 rounded-sm" style={{ backgroundColor: COLOR_PREVENTIVO }} /> Preventivo</span>
        <span className="inline-flex items-center gap-1.5 text-slate-600"><span className="h-2 w-3 rounded-sm" style={{ backgroundColor: COLOR_CORRECTIVO }} /> Correctivo</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Mantenimientos por periodo, preventivo contra correctivo">
        <g transform={`translate(${PAD.left},${PAD.top})`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={0} y1={y(t)} x2={plotW} y2={y(t)} stroke="#e1e0d9" strokeWidth={1} />
              <text x={-6} y={y(t)} dy={3} textAnchor="end" fontSize={9} fill="#898781">{formatMiles(t)}</text>
            </g>
          ))}
          <line x1={0} y1={plotH} x2={plotW} y2={plotH} stroke="#c3c2b7" strokeWidth={1} />

          {data.map((d, i) => {
            const cx = i * groupW + groupW / 2;
            const bars = [
              { key: 'preventivos', value: d.preventivos, color: COLOR_PREVENTIVO, x: cx - barW - gap / 2 },
              { key: 'correctivos', value: d.correctivos, color: COLOR_CORRECTIVO, x: cx + gap / 2 },
            ];
            return (
              <g key={d.periodo}>
                {bars.map((b) => {
                  const h = plotH - y(b.value);
                  const activo = hover?.periodo === d.periodo && hover?.key === b.key;
                  return (
                    <rect
                      key={b.key}
                      x={b.x} y={y(b.value)} width={barW} height={Math.max(h, b.value > 0 ? 1 : 0)}
                      rx={3} fill={b.color} opacity={activo ? 1 : hover ? 0.85 : 1}
                      onMouseEnter={() => setHover({ periodo: d.periodo, key: b.key })}
                      onMouseLeave={() => setHover(null)}
                    >
                      <title>{`${formatPeriodo(d.periodo)} · ${b.key === 'preventivos' ? 'Preventivo' : 'Correctivo'}: ${formatMiles(b.value)}`}</title>
                    </rect>
                  );
                })}
                <text x={cx} y={plotH + 16} textAnchor="middle" fontSize={9} fill="#52514e">{formatPeriodo(d.periodo).split(' ')[0]}</text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
