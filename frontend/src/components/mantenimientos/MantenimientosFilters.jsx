import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Select, inputClass } from '../ui/FormField.jsx';
import { ESTADOS, PRIORIDADES, TIPOS, UNIDADES } from '../../utils/mantenimientosConfig';

const OPCIONES_ESTADO = ['programado', 'vencido', 'en_proceso', 'realizado', 'reprogramado', 'cancelado'];

/**
 * Busqueda y filtros del modulo. En movil se esconden detras del boton "Filtros"
 * (igual que en Colaboradores y en el inventario).
 */
export default function MantenimientosFilters({ searchInput, onSearch, filters, onChange }) {
  const [abierto, setAbierto] = useState(false);
  const activos = ['tipo', 'estado', 'prioridad', 'unidad'].filter((k) => filters[k]).length;

  const campo = (name, label, opciones) => (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      <Select id={`f-${name}`} value={filters[name]} onChange={(e) => onChange({ [name]: e.target.value })}>
        <option value="">Todos</option>
        {opciones}
      </Select>
    </label>
  );

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="f-buscar"
            type="search"
            value={searchInput}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Buscar por folio, unidad o descripción…"
            aria-label="Buscar mantenimientos"
            className={`${inputClass(false)} pl-9`}
          />
        </div>
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:hidden"
        >
          <SlidersHorizontal size={16} /> Filtros
          {activos > 0 && (
            <span className="rounded-full bg-brand-900 px-1.5 text-xs font-semibold text-oncolor">{activos}</span>
          )}
        </button>
      </div>

      <div className={`${abierto ? 'grid' : 'hidden'} mt-3 grid-cols-1 gap-3 sm:mt-4 sm:grid sm:grid-cols-2 lg:grid-cols-4`}>
        {campo('tipo', 'Tipo', Object.entries(TIPOS).map(([v, c]) => <option key={v} value={v}>{c.label}</option>))}
        {campo('estado', 'Estado', OPCIONES_ESTADO.map((v) => <option key={v} value={v}>{ESTADOS[v].label}</option>))}
        {campo('prioridad', 'Prioridad', Object.entries(PRIORIDADES).map(([v, c]) => <option key={v} value={v}>{c.label}</option>))}
        {campo('unidad', 'Tipo de unidad', Object.entries(UNIDADES).map(([v, c]) => <option key={v} value={v}>{c.plural}</option>))}
      </div>

      {activos > 0 && (
        <button
          type="button"
          onClick={() => onChange({ tipo: '', estado: '', prioridad: '', unidad: '' })}
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-brand-500"
        >
          <X size={14} /> Quitar filtros
        </button>
      )}
    </section>
  );
}
