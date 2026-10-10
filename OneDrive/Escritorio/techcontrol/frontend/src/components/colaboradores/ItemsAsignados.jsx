import { Link } from 'react-router-dom';
import { Undo2, UserPlus } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { SectionCard, EmptyState } from '../ui/SectionCard.jsx';
import TipoItem from '../inventario/TipoItem.jsx';
import EstadoInventarioBadge from '../inventario/EstadoInventarioBadge.jsx';
import { KINDS } from '../../utils/inventarioConfig';
import { formatDate } from '../../utils/formatters';

const SinSerie = () => <span className="text-slate-400">Sin número de serie</span>;

// Columnas por tipo (accesorios: nombre + marca/modelo; el resto: marca y modelo separados).
const COLUMNS = {
  equipos: ['Tipo', 'Marca', 'Modelo', 'Código', 'N.º serie', 'Asignado', 'Estado'],
  accesorios: ['Tipo', 'Nombre', 'Marca', 'Modelo', 'Código', 'N.º serie', 'Asignado', 'Estado'],
  impresoras: ['Tipo', 'Marca', 'Modelo', 'Código', 'N.º serie', 'Asignado', 'Estado'],
  celulares: ['Tipo', 'Marca', 'Modelo', 'Código', 'N.º serie', 'Asignado', 'Estado'],
};

/**
 * Lo que un colaborador tiene asignado ACTUALMENTE
 * (kind = 'equipos' | 'accesorios' | 'impresoras' | 'celulares').
 * `onAsignar` / `onDevolver` solo se pasan a quien puede gestionar.
 */
export default function ItemsAsignados({ kind, items, loading, error, onAsignar, onDevolver }) {
  const cfg = KINDS[kind];
  const canAct = !!onAsignar;
  const columns = [...COLUMNS[kind], ...(canAct ? [''] : [])];

  return (
    <SectionCard
      title={`${cfg.Plural} asignad${cfg.o}s`}
      description={`${cfg.Plural} que tiene a su cargo actualmente.`}
      count={loading || error ? undefined : items.length}
      action={
        onAsignar && (
          <Button variant="secondary" icon={UserPlus} onClick={onAsignar}>
            Asignar {cfg.singular}
          </Button>
        )
      }
    >
      {loading ? (
        <p className="px-5 py-8 text-center text-sm text-slate-400">Cargando {cfg.plural}…</p>
      ) : error ? (
        <p className="px-5 py-8 text-center text-sm text-red-600">{error}</p>
      ) : items.length === 0 ? (
        <EmptyState icon={cfg.icon} message={`Este colaborador no tiene ${cfg.plural} asignad${cfg.o}s.`} />
      ) : (
        <div className="table-scroll overflow-x-auto">
          <table className={`w-full text-left text-sm ${kind === 'accesorios' ? 'min-w-[940px]' : 'min-w-[820px]'}`}>
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {columns.map((h, i) => (
                  <th key={i} scope="col" className="whitespace-nowrap px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {items.map((i) => (
                <tr key={i.asignacion_id}>
                  <td className="whitespace-nowrap px-5 py-3"><TipoItem tipo={i.tipo} /></td>
                  {kind === 'accesorios' && <td className="px-5 py-3 font-medium text-slate-800">{i.nombre}</td>}
                  <td className="px-5 py-3">{i.marca || '—'}</td>
                  <td className="px-5 py-3">{i.modelo || '—'}</td>
                  <td className="whitespace-nowrap px-5 py-3 font-medium">
                    <Link to={`${cfg.basePath}/${i[cfg.idField]}`} className="text-slate-700 hover:text-brand-500">
                      {i.codigo_inventario}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3">{i.numero_serie || <SinSerie />}</td>
                  <td className="whitespace-nowrap px-5 py-3">{formatDate(i.fecha_asignacion)}</td>
                  <td className="px-5 py-3"><EstadoInventarioBadge estado={i.estado} /></td>
                  {canAct && (
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onDevolver(i)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        <Undo2 size={14} /> Devolver
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
