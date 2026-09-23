import { useState } from 'react';
import { Search, X, FilterX, SlidersHorizontal } from 'lucide-react';
import { Select, inputClass } from '../ui/FormField.jsx';
import { ColaboradorPicker } from './pickers.jsx';
import { useCanManage } from '../../hooks/useCanManage';
import { ESTADOS, KINDS } from '../../utils/inventarioConfig';

/**
 * Busqueda + filtros de Equipos/Accesorios/Impresoras/Celulares. Es "controlada": no consulta nada,
 * solo emite cambios; la pagina los manda al backend.
 * Movil: los filtros se ocultan tras el boton "Filtros" (el buscador queda a la vista).
 */
export default function InventarioFilters({
  kind,
  search,
  onSearchChange,
  filters,
  onFilterChange,
  colaborador,
  onColaboradorChange,
  onClear,
  tipos,
  marcas,
  ubicaciones = [],
  hasActiveFilters,
}) {
  const cfg = KINDS[kind];
  const canManage = useCanManage(); // los colaboradores solo los consultan admin y tecnico
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeCount = ['tipo', 'estado', 'asignacion', 'marca', 'colaborador', 'ubicacion'].filter((k) => filters[k]).length;

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={cfg.showUbicacion ? 'Buscar por código, serie, marca, modelo o IP' : kind === 'celulares' ? 'Buscar por código, serie, IMEI, marca o modelo' : 'Buscar por código, serie, marca o modelo'}
            title="Busca por código de inventario, número de serie, marca o modelo"
            aria-label="Buscar"
            className={`${inputClass(false)} pl-10 pr-10`}
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-controls="inventario-filtros"
          className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium sm:hidden
            ${mobileOpen ? 'border-brand-500 bg-brand-500/5 text-brand-500' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
        >
          <SlidersHorizontal size={16} />
          Filtros
          {activeCount > 0 && (
            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-500 px-1 text-xs font-semibold text-oncolor">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      <div
        id="inventario-filtros"
        className={`${mobileOpen ? 'grid' : 'hidden'} grid-cols-1 gap-3 sm:grid sm:grid-cols-2 ${cfg.catalog ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}
      >
        {cfg.catalog && (
          <Select aria-label="Filtrar por tipo" value={filters.tipo} onChange={(e) => onFilterChange('tipo', e.target.value)}>
            <option value="">Todos los tipos</option>
            {tipos.map((t) => (
              <option key={t.id} value={t.nombre}>{t.nombre}</option>
            ))}
          </Select>
        )}

        <Select aria-label="Filtrar por estado" value={filters.estado} onChange={(e) => onFilterChange('estado', e.target.value)}>
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS).map(([value, { label }]) => (
            <option key={value} value={value}>{label}</option>
          ))}
          <option value="mantenimiento,reparacion">Mantenimiento o reparación</option>
        </Select>

        <Select aria-label="Filtrar por asignación" value={filters.asignacion} onChange={(e) => onFilterChange('asignacion', e.target.value)}>
          <option value="">Asignados y sin asignar</option>
          <option value="con">Asignados</option>
          <option value="sin">Sin asignar</option>
        </Select>

        {cfg.extraFilter === 'marca' ? (
          <Select aria-label="Filtrar por marca" value={filters.marca} onChange={(e) => onFilterChange('marca', e.target.value)}>
            <option value="">Todas las marcas</option>
            {marcas.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </Select>
        ) : cfg.extraFilter === 'ubicacion' ? (
          <Select aria-label="Filtrar por ubicación" value={filters.ubicacion} onChange={(e) => onFilterChange('ubicacion', e.target.value)}>
            <option value="">Todas las ubicaciones</option>
            {ubicaciones.map((u) => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </Select>
        ) : canManage ? (
          <ColaboradorPicker
            id="filtro-colaborador"
            value={colaborador}
            onChange={onColaboradorChange}
            placeholder="Colaborador…"
          />
        ) : (
          <div className="hidden lg:block" />
        )}

        <button
          type="button"
          onClick={onClear}
          disabled={!hasActiveFilters}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FilterX size={16} /> Limpiar filtros
        </button>
      </div>
    </div>
  );
}
