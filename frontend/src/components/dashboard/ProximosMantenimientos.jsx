import { CalendarClock } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import { formatDate, todayISO } from '../../utils/formatters';

const TIPO_LABEL = { preventivo: 'Preventivo', correctivo: 'Correctivo' };

/** Tabla compacta de los proximos mantenimientos programados (los mas cercanos primero). */
export default function ProximosMantenimientos({ mantenimientos }) {
  if (!mantenimientos.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <CalendarClock className="text-slate-300" size={28} />
        <p className="text-sm text-slate-500">No hay mantenimientos programados.</p>
      </div>
    );
  }

  const hoy = todayISO();

  return (
    <div className="table-scroll overflow-x-auto">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <th className="py-2 pr-3">Equipo</th>
            <th className="py-2 pr-3">Tipo</th>
            <th className="py-2 pr-3">Fecha programada</th>
            <th className="py-2 pr-3">Responsable</th>
            <th className="py-2 pr-3">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {mantenimientos.map((m) => {
            const vencido = m.fecha_programada < hoy;
            return (
              <tr key={m.id}>
                <td className="py-2.5 pr-3">
                  <p className="font-medium text-slate-800">{m.equipo || m.codigo_inventario || '—'}</p>
                  <p className="text-xs text-slate-500">{m.codigo_inventario}{m.tipo_unidad ? ` · ${m.tipo_unidad}` : ''}</p>
                </td>
                <td className="py-2.5 pr-3 text-slate-600">{TIPO_LABEL[m.tipo] || m.tipo}</td>
                <td className="py-2.5 pr-3 text-slate-600">{formatDate(m.fecha_programada)}</td>
                <td className="py-2.5 pr-3 text-slate-600">{m.responsable || '—'}</td>
                <td className="py-2.5 pr-3">
                  <Badge tone={vencido ? 'red' : 'blue'}>{vencido ? 'Vencido' : 'Programado'}</Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
