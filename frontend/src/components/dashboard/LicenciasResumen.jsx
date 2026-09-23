import { Link } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import Badge from '../ui/Badge.jsx';

const ESTADO_BADGE = {
  agotada: { tone: 'red', label: 'Agotada' },
  por_vencer: { tone: 'amber', label: 'Por vencer' },
};

const Mini = ({ label, value }) => (
  <div>
    <p className="text-xl font-bold text-slate-800">{value}</p>
    <p className="text-xs text-slate-500">{label}</p>
  </div>
);

/** Resumen de licencias: puestos totales/usados/disponibles y las que mas atencion piden. */
export default function LicenciasResumen({ licencias }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Mini label="Total de licencias" value={licencias.total} />
        <Mini label="Utilizadas" value={licencias.utilizadas} />
        <Mini label="Disponibles" value={licencias.disponibles} />
        <Mini label="Próximas a vencer" value={licencias.por_vencer} />
      </div>

      {licencias.prioridad.length > 0 && (
        <div className="border-t border-slate-100 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Requieren atención</p>
          <ul className="space-y-2">
            {licencias.prioridad.map((l) => (
              <li key={l.id}>
                <Link to={`/licencias/${l.id}`} className="flex items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm hover:bg-slate-50">
                  <KeyRound size={15} className="shrink-0 text-slate-400" />
                  <span className="flex-1 truncate text-slate-700">{l.software} <span className="text-slate-400">({l.codigo})</span></span>
                  {ESTADO_BADGE[l.estado_efectivo] && (
                    <Badge tone={ESTADO_BADGE[l.estado_efectivo].tone}>
                      {l.estado_efectivo === 'agotada' ? ESTADO_BADGE.agotada.label : `${l.dias_para_vencer} días`}
                    </Badge>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
