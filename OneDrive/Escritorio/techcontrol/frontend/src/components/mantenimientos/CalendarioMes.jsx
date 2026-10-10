import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { DIAS_SEMANA, agruparPorFecha, diasDelMes, nombreMes, sumarMeses } from '../../utils/calendario';
import { ESTADOS, TIPOS, formatHora } from '../../utils/mantenimientosConfig';

const MAX_CHIPS = 3;

/** Etiqueta de un mantenimiento dentro de una celda del mes. */
function Chip({ mantenimiento, onClick }) {
  const estado = ESTADOS[mantenimiento.estado_efectivo] || ESTADOS.programado;
  const Icon = (TIPOS[mantenimiento.tipo] || TIPOS.preventivo).icon;
  const hora = formatHora(mantenimiento.hora_programada);

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(mantenimiento); }}
      title={`${mantenimiento.recurso.codigo_inventario} · ${TIPOS[mantenimiento.tipo]?.label}${hora ? ` · ${hora}` : ''}`}
      className={`flex w-full items-center gap-1 truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium ring-1 ring-inset transition-transform hover:scale-[1.02] ${estado.chip}`}
    >
      <Icon size={10} className="shrink-0" />
      <span className="truncate">{mantenimiento.recurso.codigo_inventario}</span>
    </button>
  );
}

/**
 * Calendario mensual de mantenimientos (cuadricula propia, sin dependencias).
 * Escritorio: cada dia muestra hasta 3 etiquetas y "+N más".
 * Movil: puntos de color (la lista del dia se ve en el panel de abajo).
 */
export default function CalendarioMes({
  mes,
  mantenimientos,
  diaSeleccionado,
  onMes,
  onDia,
  onAbrir,
  onAgendar,
  canManage,
  loading,
}) {
  const porFecha = agruparPorFecha(mantenimientos);
  const celdas = diasDelMes(mes);

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMes(sumarMeses(mes, -1))}
            aria-label="Mes anterior"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <ChevronLeft size={18} />
          </button>
          <h3 className="min-w-[10rem] text-center text-sm font-semibold text-slate-800 sm:text-base">
            {nombreMes(mes)}
          </h3>
          <button
            type="button"
            onClick={() => onMes(sumarMeses(mes, 1))}
            aria-label="Mes siguiente"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {loading && <span className="text-xs text-slate-400">Cargando…</span>}
          <span className="text-xs text-slate-500">
            {mantenimientos.length} {mantenimientos.length === 1 ? 'mantenimiento' : 'mantenimientos'} este mes
          </span>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="px-1 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{d.slice(0, 2)}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {celdas.map((celda) => {
          const items = porFecha[celda.iso] || [];
          const seleccionado = celda.iso === diaSeleccionado;
          return (
            <div
              key={celda.iso}
              role="button"
              tabIndex={0}
              aria-label={`Día ${celda.dia}, ${items.length} mantenimiento(s)`}
              aria-current={seleccionado ? 'date' : undefined}
              onClick={() => onDia(celda.iso)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDia(celda.iso); } }}
              className={`group relative flex min-h-[4.5rem] cursor-pointer flex-col gap-1 border-b border-r border-slate-100 p-1.5 text-left transition-colors sm:min-h-[6.5rem]
                ${celda.esDelMes ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/50 text-slate-400'}
                ${seleccionado ? 'ring-2 ring-inset ring-brand-500/40' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold
                    ${celda.esHoy ? 'bg-brand-900 text-oncolor' : celda.esDelMes ? 'text-slate-600' : 'text-slate-400'}`}
                >
                  {celda.dia}
                </span>
                {canManage && celda.esDelMes && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onAgendar(celda.iso); }}
                    aria-label={`Agendar mantenimiento el día ${celda.dia}`}
                    className="hidden rounded p-0.5 text-slate-400 hover:bg-brand-900/5 hover:text-brand-500 group-hover:block"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>

              {/* Movil: puntos. Escritorio: etiquetas. */}
              <div className="flex flex-wrap gap-1 sm:hidden">
                {items.slice(0, 4).map((m) => (
                  <span
                    key={m.id}
                    className={`h-1.5 w-1.5 rounded-full ring-1 ring-inset ${(ESTADOS[m.estado_efectivo] || ESTADOS.programado).chip}`}
                  />
                ))}
              </div>
              <div className="hidden flex-1 flex-col gap-1 overflow-hidden sm:flex">
                {items.slice(0, MAX_CHIPS).map((m) => (
                  <Chip key={m.id} mantenimiento={m} onClick={onAbrir} />
                ))}
                {items.length > MAX_CHIPS && (
                  <span className="px-1 text-[11px] font-medium text-slate-500">+{items.length - MAX_CHIPS} más</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
