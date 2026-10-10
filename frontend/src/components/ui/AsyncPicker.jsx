import { useEffect, useRef, useState } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { inputClass } from './FormField.jsx';
import { useDebounce } from '../../hooks/useDebounce';

/**
 * Selector con busqueda contra el backend (para listas grandes: colaboradores,
 * equipos disponibles...). Los resultados se muestran debajo del campo, en el
 * flujo normal, para no quedar recortados dentro de un modal con scroll.
 *
 *  - value:      objeto elegido (o null)
 *  - fetcher(q): Promise<array> con los resultados para el texto q
 *  - getLabel:   texto del elemento elegido
 *  - renderOption(item): contenido de cada resultado
 */
export default function AsyncPicker({
  id,
  value,
  onChange,
  fetcher,
  getLabel,
  renderOption,
  placeholder = 'Buscar…',
  emptyLabel = 'Sin resultados.',
  error,
  disabled = false,
  clearable = true,
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const debounced = useDebounce(query, 250);
  const wrapRef = useRef(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setLoading(true);
    fetcherRef
      .current(debounced.trim())
      .then((items) => !cancelled && (setResults(items), setActive(0)))
      .catch(() => !cancelled && setResults([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debounced, open]);

  // Cierra la lista al hacer clic fuera.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const choose = (item) => {
    onChange(item);
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && open) {
      e.preventDefault(); // no enviar el formulario
      if (results[active]) choose(results[active]);
    } else if (e.key === 'Escape' && open) {
      e.stopPropagation(); // cierra la lista, no el modal
      setOpen(false);
    }
  };

  // Elegido: se muestra como un campo de solo lectura con boton para quitarlo.
  if (value) {
    return (
      <div
        className={`flex items-center justify-between gap-2 ${inputClass(!!error)} ${disabled ? 'bg-slate-100' : ''}`}
      >
        <span id={id} className="min-w-0 truncate text-slate-800">{getLabel(value)}</span>
        {clearable && !disabled && (
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Quitar selección"
            className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={wrapRef}>
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          type="text"
          value={query}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-invalid={!!error}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={`${inputClass(!!error)} pl-9`}
        />
        {loading && (
          <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
        )}
      </div>

      {open && (
        <ul
          role="listbox"
          className="mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          {results.length === 0 && !loading && (
            <li className="px-3 py-3 text-sm text-slate-400">{emptyLabel}</li>
          )}
          {results.map((item, i) => (
            <li
              key={item.id}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault(); // evita perder el foco antes del clic
                choose(item);
              }}
              className={`cursor-pointer px-3 py-2 text-sm ${i === active ? 'bg-brand-500/10' : 'hover:bg-slate-50'}`}
            >
              {renderOption(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
