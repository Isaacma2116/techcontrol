import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Select, inputClass } from '../ui/FormField.jsx';
import { catalogoService } from '../../services/colaboradorService';
import { ESTADOS_SOFTWARE, TIPOS_SOFTWARE } from '../../utils/licenciasConfig';

/** Busqueda y filtros de /software. En movil, detras del boton "Filtros". */
export default function SoftwareFilters({ searchInput, onSearch, filters, onChange }) {
  const [abierto, setAbierto] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const activos = ['tipo', 'categoria', 'requiere_licencia', 'estado'].filter((k) => filters[k] !== '').length;

  useEffect(() => {
    catalogoService.list('categorias-software').then((res) => setCategorias(res.data.items)).catch(() => {});
  }, []);

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
            id="f-buscar" type="search" value={searchInput} onChange={(e) => onSearch(e.target.value)}
            placeholder="Buscar por nombre o fabricante…" aria-label="Buscar software"
            className={`${inputClass(false)} pl-9`}
          />
        </div>
        <button
          type="button" onClick={() => setAbierto((v) => !v)} aria-expanded={abierto}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:hidden"
        >
          <SlidersHorizontal size={16} /> Filtros
          {activos > 0 && <span className="rounded-full bg-brand-900 px-1.5 text-xs font-semibold text-oncolor">{activos}</span>}
        </button>
      </div>

      <div className={`${abierto ? 'grid' : 'hidden'} mt-3 grid-cols-1 gap-3 sm:mt-4 sm:grid sm:grid-cols-2 lg:grid-cols-4`}>
        {campo('tipo', 'Tipo', Object.entries(TIPOS_SOFTWARE).map(([v, c]) => <option key={v} value={v}>{c.label}</option>))}
        {campo('categoria', 'Categoría', categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>))}
        {campo('requiere_licencia', '¿Requiere licencia?', [<option key="s" value="true">Sí</option>, <option key="n" value="false">No</option>])}
        {campo('estado', 'Estado', Object.entries(ESTADOS_SOFTWARE).map(([v, c]) => <option key={v} value={v}>{c.label}</option>))}
      </div>

      {activos > 0 && (
        <button
          type="button"
          onClick={() => onChange({ tipo: '', categoria: '', requiere_licencia: '', estado: '' })}
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-brand-500"
        >
          <X size={14} /> Quitar filtros
        </button>
      )}
    </section>
  );
}
