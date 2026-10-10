import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';
import { ESTADO_COLOR, formatMiles } from '../../utils/reportesConfig';

/**
 * Barras de estado (garantias vigentes/por vencer/vencidas): usa el canal de
 * "status", nunca el categorico, y siempre va con icono + etiqueta (el color
 * de estado por si solo no basta, sobre todo ambar y "serio" sobre blanco).
 */
const ITEMS = [
  { key: 'vigentes', label: 'Vigentes', color: ESTADO_COLOR.good, Icon: CheckCircle2 },
  { key: 'por_vencer', label: 'Por vencer', color: ESTADO_COLOR.warning, Icon: AlertTriangle },
  { key: 'vencidas', label: 'Vencidas', color: ESTADO_COLOR.critical, Icon: XCircle },
  { key: 'sin_garantia', label: 'Sin garantía registrada', color: ESTADO_COLOR.neutral, Icon: HelpCircle },
];

export default function EstadoBarras({ data }) {
  const total = ITEMS.reduce((s, i) => s + (data[i.key] || 0), 0);
  if (total === 0) return <p className="px-1 py-6 text-center text-sm text-slate-400">Sin activos para los filtros aplicados.</p>;

  const max = Math.max(...ITEMS.map((i) => data[i.key] || 0), 1);

  return (
    <div className="space-y-2.5">
      {ITEMS.map(({ key, label, color, Icon }) => {
        const value = data[key] || 0;
        const pct = Math.max((value / max) * 100, value > 0 ? 3 : 0);
        return (
          <div key={key}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                <Icon size={13} style={{ color }} /> {label}
              </span>
              <span className="font-semibold text-slate-800">{formatMiles(value)}</span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100">
              <div className="h-3 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} title={`${label}: ${formatMiles(value)}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
