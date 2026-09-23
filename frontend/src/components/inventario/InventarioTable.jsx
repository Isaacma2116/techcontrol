import { Link, useNavigate } from 'react-router-dom';
import ItemThumb from './ItemThumb.jsx';
import EstadoInventarioBadge from './EstadoInventarioBadge.jsx';
import { KINDS } from '../../utils/inventarioConfig';

// Texto principal y secundario de la columna "Descripcion" segun el tipo.
function describe(cfg, i) {
  if (cfg.byMarca) return { main: i.marca || i.tipo, sub: i.modelo };
  return { main: i.titulo, sub: [i.marca, i.modelo].filter(Boolean).join(' ') };
}

const Serie = ({ value }) =>
  value ? <span>{value}</span> : <span className="text-slate-400">Sin número de serie</span>;

const Colaborador = ({ item }) =>
  item.colaborador_nombre ? (
    <div className="min-w-0">
      <p className="truncate text-slate-800">{item.colaborador_nombre}</p>
      <p className="text-xs text-slate-400">{item.colaborador_id_empleado}</p>
    </div>
  ) : (
    <span className="text-slate-400">Sin asignar</span>
  );

/**
 * Listado de equipos/accesorios/impresoras/celulares: tabla en tablet y escritorio, tarjetas en movil.
 * Al hacer clic en una fila se abre el detalle.
 */
export default function InventarioTable({ kind, items }) {
  const navigate = useNavigate();
  const cfg = KINDS[kind];
  const base = cfg.basePath;
  const headers = [
    'Código',
    ...(cfg.catalog ? ['Tipo'] : []),
    cfg.byMarca ? 'Marca / modelo' : 'Descripción',
    ...(cfg.showUbicacion ? ['Ubicación'] : []),
    'Número de serie',
    'Estado',
    'Colaborador actual',
  ];

  return (
    <>
      {/* Tablet / escritorio */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="table-scroll overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {headers.map((h) => (
                  <th key={h} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {items.map((i) => {
                const d = describe(cfg, i);
                return (
                  <tr
                    key={i.id}
                    onClick={() => navigate(`${base}/${i.id}`)}
                    className="cursor-pointer transition-colors hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ItemThumb kind={kind} imagen={i.imagen} />
                        <Link
                          to={`${base}/${i.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="whitespace-nowrap font-semibold text-slate-800 hover:text-brand-500"
                        >
                          {i.codigo_inventario}
                        </Link>
                      </div>
                    </td>
                    {cfg.catalog && <td className="whitespace-nowrap px-4 py-3">{i.tipo}</td>}
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{d.main}</p>
                      {d.sub && <p className="text-xs text-slate-400">{d.sub}</p>}
                    </td>
                    {cfg.showUbicacion && (
                      <td className="whitespace-nowrap px-4 py-3">
                        {i.ubicacion || <span className="text-slate-400">Sin ubicación</span>}
                      </td>
                    )}
                    <td className="whitespace-nowrap px-4 py-3"><Serie value={i.numero_serie} /></td>
                    <td className="px-4 py-3"><EstadoInventarioBadge estado={i.estado} /></td>
                    <td className="px-4 py-3"><Colaborador item={i} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movil */}
      <ul className="space-y-3 md:hidden">
        {items.map((i) => {
          const d = describe(cfg, i);
          return (
            <li key={i.id}>
              <Link
                to={`${base}/${i.id}`}
                className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm active:bg-slate-50"
              >
                <ItemThumb kind={kind} imagen={i.imagen} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-800">{i.codigo_inventario}</p>
                    <EstadoInventarioBadge estado={i.estado} />
                  </div>
                  <p className="truncate text-sm text-slate-700">{[i.tipo, d.main, d.sub].filter(Boolean).join(' · ')}</p>
                  {cfg.showUbicacion && i.ubicacion && <p className="truncate text-xs text-slate-500">{i.ubicacion}</p>}
                  <p className="text-xs text-slate-400"><Serie value={i.numero_serie} /></p>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {i.colaborador_nombre ? `Con ${i.colaborador_nombre}` : 'Sin asignar'}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
