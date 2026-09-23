import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, Wrench } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { SectionCard, EmptyState } from '../ui/SectionCard.jsx';
import { EstadoMantenimientoBadge, TipoMantenimientoBadge } from './MantenimientoBadges.jsx';
import MantenimientoModales from './MantenimientoModales.jsx';
import { useSubresource } from '../../hooks/useSubresource';
import { mantenimientoService } from '../../services/mantenimientoService';
import { UNIDAD_POR_KIND, formatHora } from '../../utils/mantenimientosConfig';
import { formatDate } from '../../utils/formatters';

/**
 * Mantenimientos de una unidad del inventario, para su ficha: los proximos y los
 * ya realizados, con lo que se hizo en cada uno.
 */
export default function MantenimientosUnidad({ kind, item, canManage }) {
  const tipoRecurso = UNIDAD_POR_KIND[kind];
  const [reloadKey, setReloadKey] = useState(0);
  const [modal, setModal] = useState(null);

  const fetcher = useCallback(() => mantenimientoService.porUnidad(tipoRecurso, item.id), [tipoRecurso, item.id]);
  const { items, loading, error } = useSubresource(fetcher, 'mantenimientos', item.id, reloadKey);

  const recargar = () => setReloadKey((k) => k + 1);
  const guardado = () => { setModal(null); recargar(); };

  const accion = canManage && (
    <Button variant="secondary" icon={CalendarPlus} onClick={() => setModal({ tipo: 'form' })}>
      Agendar mantenimiento
    </Button>
  );

  return (
    <>
      <SectionCard
        title="Mantenimientos"
        description="Preventivos y correctivos de esta unidad."
        count={loading ? undefined : items.length}
        action={
          <div className="flex items-center gap-3">
            <Link to={`/mantenimientos?unidad=${tipoRecurso}&q=${item.codigo_inventario}&vista=lista`} className="text-sm font-medium text-brand-500 hover:underline">
              Ver todos
            </Link>
            {accion}
          </div>
        }
      >
        {loading ? (
          <div className="space-y-2 p-5">{[0, 1].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}</div>
        ) : error ? (
          <p className="px-5 py-6 text-center text-sm text-red-600">{error}</p>
        ) : items.length === 0 ? (
          <EmptyState icon={Wrench} message="Esta unidad no tiene mantenimientos registrados." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setModal({ tipo: 'detalle', id: m.id })}
                  className="flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-slate-800">{formatDate(m.fecha_programada)}</span>
                      {m.hora_programada && <span className="text-xs text-slate-400">{formatHora(m.hora_programada)}</span>}
                      <TipoMantenimientoBadge tipo={m.tipo} />
                      <EstadoMantenimientoBadge mantenimiento={m} />
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {m.trabajo_realizado || m.motivo || 'Sin descripción'}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-slate-400">{m.folio}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <MantenimientoModales
        modal={modal}
        setModal={setModal}
        onGuardado={guardado}
        onCambio={recargar}
        canManage={canManage}
        unidad={{
          tipo_recurso: tipoRecurso,
          id: item.id,
          codigo_inventario: item.codigo_inventario,
          titulo: item.titulo,
          tipo: item.tipo,
        }}
      />
    </>
  );
}
