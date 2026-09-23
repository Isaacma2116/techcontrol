import { useState } from 'react';
import { Search, X, FilterX, SlidersHorizontal } from 'lucide-react';
import { Select, inputClass } from '../ui/FormField.jsx';

/**
 * Barra de busqueda + filtros. Es "controlada": no consulta nada por si
 * misma, solo emite cambios; la pagina los manda al backend.
 */
export default function ColaboradoresFilters({
  search,
  onSearchChange,
  filters,
  onFilterChange,
  onClear,
  areas,
  cargos,
  hasActiveFilters,
}) {
  // Solo aplica en movil: desde sm los filtros siempre estan visibles.
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeCount = ['area', 'cargo', 'estado', 'equipo'].filter((k) => filters[k]).length;

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex gap-2">
      <div className="relative min-w-0 flex-1">
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nombre, ID o correo"
          title="Busca por nombre, apellidos, ID de empleado o correo empresarial"
          aria-label="Buscar colaboradores"
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
          aria-controls="colaboradores-filtros"
          className={`relative inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium sm:hidden
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
        id="colaboradores-filtros"
        className={`${mobileOpen ? 'grid' : 'hidden'} grid-cols-1 gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-5`}
      >
        <Select aria-label="Filtrar por área" value={filters.area} onChange={(e) => onFilterChange('area', e.target.value)}>
          <option value="">Todas las áreas</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>{a.nombre}</option>
          ))}
        </Select>

        <Select aria-label="Filtrar por cargo" value={filters.cargo} onChange={(e) => onFilterChange('cargo', e.target.value)}>
          <option value="">Todos los cargos</option>
          {cargos.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </Select>

        <Select aria-label="Filtrar por estado" value={filters.estado} onChange={(e) => onFilterChange('estado', e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </Select>

        <Select aria-label="Filtrar por equipo asignado" value={filters.equipo} onChange={(e) => onFilterChange('equipo', e.target.value)}>
          <option value="">Con y sin equipo</option>
          <option value="con">Con equipo asignado</option>
          <option value="sin">Sin equipo asignado</option>
        </Select>

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
