import { useState } from 'react';
import { Search, X, FilterX, SlidersHorizontal } from 'lucide-react';
import { Select, Input, inputClass } from '../ui/FormField.jsx';
import { ESTADOS_CARTA, TIPOS_RECURSO } from '../../utils/cartasConfig';

/**
 * Busqueda + filtros del listado de cartas (folio, colaborador, codigo de inventario /
 * tipo de recurso, estado, fechas, area). Controlado: solo emite cambios.
 * Movil: los filtros se ocultan tras el boton "Filtros".
 */
export default function CartasFilters({ search, onSearchChange, filters, onFilterChange, onClear, areas, hasActiveFilters }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeCount = ['tipo', 'estado', 'desde', 'hasta', 'area'].filter((k) => filters[k]).length;

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por folio, colaborador o código"
            title="Busca por folio, nombre del colaborador o código de inventario del recurso"
            aria-label="Buscar cartas"
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
          aria-controls="cartas-filtros"
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

      <div id="cartas-filtros" className={`${mobileOpen ? 'grid' : 'hidden'} grid-cols-1 gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-6`}>
        <Select aria-label="Filtrar por tipo de recurso" value={filters.tipo} onChange={(e) => onFilterChange('tipo', e.target.value)}>
          <option value="">Todos los recursos</option>
          {Object.entries(TIPOS_RECURSO).map(([value, { label }]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>

        <Select aria-label="Filtrar por estado" value={filters.estado} onChange={(e) => onFilterChange('estado', e.target.value)}>
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS_CARTA).map(([value, { label }]) => (
            <option key={value} value={value}>{label}</option>
          ))}
          <option value="generada,pendiente_firma">Pendientes de firma (todas)</option>
        </Select>

        <Select aria-label="Filtrar por área" value={filters.area} onChange={(e) => onFilterChange('area', e.target.value)}>
          <option value="">Todas las áreas</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>{a.nombre}</option>
          ))}
        </Select>

        <Input aria-label="Entrega desde" title="Entrega desde" type="date" value={filters.desde} max={filters.hasta || undefined} onChange={(e) => onFilterChange('desde', e.target.value)} />
        <Input aria-label="Entrega hasta" title="Entrega hasta" type="date" value={filters.hasta} min={filters.desde || undefined} onChange={(e) => onFilterChange('hasta', e.target.value)} />

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
