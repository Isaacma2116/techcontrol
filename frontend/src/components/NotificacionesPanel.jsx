import { useNavigate } from 'react-router-dom';
import { AlertCircle, AlertTriangle, BellOff, Check, Info } from 'lucide-react';
import { timeAgo } from '../utils/userAgent';

const PRIORIDAD = {
  critica: { icon: AlertCircle, className: 'text-red-500' },
  advertencia: { icon: AlertTriangle, className: 'text-amber-500' },
  info: { icon: Info, className: 'text-sky-500' },
};

/**
 * Panel desplegable de la campana: notificaciones recientes, mas nuevas primero.
 * Cada una es clicable (lleva al registro relacionado y se marca como leida);
 * el indicador visual de prioridad es el mismo lenguaje que usa el Dashboard
 * (rojo = critica, ambar = advertencia, azul = informativa).
 */
export default function NotificacionesPanel({ notificaciones, cargando, onLeer, onMarcarTodas, onClose }) {
  const navigate = useNavigate();
  const hayNoLeidas = notificaciones?.some((n) => !n.leida);

  const abrir = (n) => {
    if (!n.leida) onLeer(n.id);
    onClose();
    if (n.enlace) navigate(n.enlace);
  };

  return (
    // Fija respecto al viewport (no al boton de la campana): la campana no es el ultimo
    // elemento del header (el menu de usuario va despues), asi que "absolute right-0"
    // anclado a su propio contenedor angosto lo desbordaba fuera de pantalla en movil.
    <div className="fixed right-4 top-[4.5rem] z-20 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-800">Notificaciones</h3>
        {hayNoLeidas && (
          <button type="button" onClick={onMarcarTodas} className="flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
            <Check size={13} /> Marcar todas como leídas
          </button>
        )}
      </div>

      <div className="table-scroll max-h-[26rem] overflow-y-auto">
        {cargando ? (
          <div className="space-y-2 p-4">{[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />)}</div>
        ) : !notificaciones?.length ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <BellOff className="text-slate-300" size={26} />
            <p className="text-sm text-slate-500">No tienes notificaciones.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {notificaciones.map((n) => {
              const { icon: Icon, className } = PRIORIDAD[n.prioridad] || PRIORIDAD.info;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => abrir(n)}
                    className={`flex w-full items-start gap-2.5 px-4 py-3 text-left text-sm transition-colors hover:bg-slate-50 ${n.leida ? '' : 'bg-brand-900/[0.03]'}`}
                  >
                    <Icon size={16} className={`mt-0.5 shrink-0 ${className}`} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className={`truncate ${n.leida ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'}`}>{n.titulo}</span>
                        {!n.leida && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-label="No leída" />}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">{n.mensaje}</span>
                      <span className="mt-1 block text-[11px] text-slate-400">{timeAgo(n.created_at)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
