import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import { formatDate } from '../../utils/formatters';

const RUTA = {
  equipos: '/equipos', accesorios: '/accesorios', impresoras: '/impresoras',
  celulares: '/celulares', dispositivos_red: '/dispositivos-red',
};

function EstadoGarantia({ dias, vencida }) {
  if (vencida) return <Badge tone="red">Vencida</Badge>;
  if (dias <= 15) return <Badge tone="red">{dias} días</Badge>;
  if (dias <= 30) return <Badge tone="amber">{dias} días</Badge>;
  return <Badge tone="blue">{dias} días</Badge>;
}

/** Equipos (de cualquier tipo) cuya garantía vence pronto o ya venció; cada fila lleva a su detalle. */
export default function GarantiasProximas({ items }) {
  if (!items.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <ShieldAlert className="text-slate-300" size={28} />
        <p className="text-sm text-slate-500">Ningún activo tiene la garantía por vencer.</p>
      </div>
    );
  }

  return (
    <div className="table-scroll overflow-x-auto">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <th className="py-2 pr-3">Equipo</th>
            <th className="py-2 pr-3">Marca</th>
            <th className="py-2 pr-3">Modelo</th>
            <th className="py-2 pr-3">Proveedor</th>
            <th className="py-2 pr-3">Vencimiento</th>
            <th className="py-2 pr-3">Días restantes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((g) => (
            <tr key={`${g.kind}-${g.id}`}>
              <td className="py-2.5 pr-3">
                <Link to={`${RUTA[g.kind]}/${g.id}`} className="font-medium text-brand-500 hover:underline">
                  {g.codigo_inventario}
                </Link>
              </td>
              <td className="py-2.5 pr-3 text-slate-600">{g.marca || '—'}</td>
              <td className="py-2.5 pr-3 text-slate-600">{g.modelo || '—'}</td>
              <td className="py-2.5 pr-3 text-slate-600">{g.proveedor || '—'}</td>
              <td className="py-2.5 pr-3 text-slate-600">{formatDate(g.garantia_vence)}</td>
              <td className="py-2.5 pr-3"><EstadoGarantia dias={g.dias_restantes} vencida={g.vencida} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
