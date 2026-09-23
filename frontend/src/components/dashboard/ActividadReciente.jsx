import {
  Boxes, Clock, KeyRound, Laptop, Mouse, Printer, Router, Smartphone, User, Users, Wrench,
} from 'lucide-react';
import { timeAgo } from '../../utils/userAgent';

const ICONO = {
  equipo: Laptop, accesorio: Mouse, impresora: Printer, celular: Smartphone,
  colaborador: Users, mantenimiento: Wrench, licencia: KeyRound, software: KeyRound,
  red: Router, dispositivo_red: Router,
};

/**
 * Actividad reciente: lo ultimo que paso en el sistema (audit_logs), con el
 * texto ya armado por el backend (una plantilla por entidad+accion).
 */
export default function ActividadReciente({ actividad }) {
  if (!actividad.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <Clock className="text-slate-300" size={28} />
        <p className="text-sm text-slate-500">Todavía no hay actividad registrada.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {actividad.map((a) => {
        const Icon = ICONO[a.entity] || Boxes;
        return (
          <li key={a.id} className="flex items-start gap-3 py-2.5">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <Icon size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-700">{a.texto}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                <User size={11} /> {a.usuario || 'Sistema'} · {timeAgo(a.created_at)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
