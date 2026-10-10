import { Link, useNavigate } from 'react-router-dom';
import CartaEstadoBadge from './CartaEstadoBadge.jsx';
import CartaAcciones from './CartaAcciones.jsx';
import { PLANTILLAS, TIPOS_RECURSO } from '../../utils/cartasConfig';
import { formatDate } from '../../utils/formatters';

/** "EQ-00001 Dell Latitude" o, con varios recursos, "EQ-00001 Dell Latitude · +2 más". */
function recursoResumen(carta) {
  const [first, ...rest] = carta.recursos || [];
  if (!first) return '—';
  const base = [first.codigo, first.descripcion].filter(Boolean).join(' ');
  return rest.length ? `${base} · +${rest.length} más` : base;
}

const tipoLabel = (carta) =>
  carta.recursos?.length === 1 ? TIPOS_RECURSO[carta.recursos[0].tipo]?.label : PLANTILLAS[carta.plantilla];

/**
 * Listado de cartas: tabla en tablet y escritorio, tarjetas en movil.
 * Al hacer clic en una fila se abre el detalle.
 */
export default function CartasTable({ cartas, onChanged }) {
  const navigate = useNavigate();

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="table-scroll overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {['Folio', 'Colaborador', 'Tipo', 'Recurso', 'Entrega', 'Estado', 'Firma', 'Acciones'].map((h, i) => (
                  <th key={h} scope="col" className={`whitespace-nowrap px-4 py-3 font-semibold ${i === 7 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {cartas.map((c) => (
                <tr key={c.id} onClick={() => navigate(`/cartas-responsivas/${c.id}`)} className="cursor-pointer transition-colors hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link to={`/cartas-responsivas/${c.id}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-slate-800 hover:text-brand-500">
                      {c.folio}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-800">{c.colaborador_nombre}</p>
                    <p className="text-xs text-slate-400">{c.id_empleado} · {c.area}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{tipoLabel(c)}</td>
                  <td className="max-w-[16rem] truncate px-4 py-3" title={recursoResumen(c)}>{recursoResumen(c)}</td>
                  <td className="whitespace-nowrap px-4 py-3">{formatDate(c.fecha_entrega)}</td>
                  <td className="px-4 py-3"><CartaEstadoBadge estado={c.estado} /></td>
                  <td className="whitespace-nowrap px-4 py-3">{c.fecha_firma ? formatDate(c.fecha_firma) : '—'}</td>
                  <td className="px-4 py-3"><CartaAcciones carta={c} onChanged={onChanged} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ul className="space-y-3 md:hidden">
        {cartas.map((c) => (
          <li key={c.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <Link to={`/cartas-responsivas/${c.id}`} className="block">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-slate-800">{c.folio}</p>
                <CartaEstadoBadge estado={c.estado} />
              </div>
              <p className="mt-1 text-sm text-slate-700">{c.colaborador_nombre}</p>
              <p className="text-xs text-slate-400">{tipoLabel(c)} · {formatDate(c.fecha_entrega)}</p>
              <p className="mt-1 truncate text-xs text-slate-500">{recursoResumen(c)}</p>
            </Link>
            <div className="mt-3 border-t border-slate-100 pt-3">
              <CartaAcciones carta={c} showVer={false} onChanged={onChanged} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
