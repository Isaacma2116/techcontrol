import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FileSignature, FilePlus, FileClock, FileCheck, FileX, ScrollText, SearchX, AlertCircle, RotateCcw,
} from 'lucide-react';
import StatCardRow from '../components/StatCardRow.jsx';
import Button from '../components/ui/Button.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import CartasFilters from '../components/cartas/CartasFilters.jsx';
import CartasTable from '../components/cartas/CartasTable.jsx';
import { useDebounce } from '../hooks/useDebounce';
import { cartaService } from '../services/cartaService';
import { catalogoService } from '../services/colaboradorService';

const PAGE_SIZE = 12;

/**
 * Cartas responsivas: resumen por estado, busqueda, filtros y listado.
 * Busqueda, filtros y pagina viven en la URL (como Colaboradores, Equipos...).
 */
export default function CartasResponsivas() {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSearch = searchParams.get('q') || '';
  const filters = {
    tipo: searchParams.get('tipo') || '',
    estado: searchParams.get('estado') || '',
    desde: searchParams.get('desde') || '',
    hasta: searchParams.get('hasta') || '',
    area: searchParams.get('area') || '',
  };
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebounce(searchInput);

  const [data, setData] = useState({ cartas: [], pagination: { total: 0, totalPages: 1 } });
  const [stats, setStats] = useState(null);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const updateParams = useCallback(
    (changes, { keepPage = false } = {}) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
          if (!keepPage) next.delete('page');
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  useEffect(() => {
    if (debouncedSearch.trim() !== urlSearch) updateParams({ q: debouncedSearch.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    catalogoService.list('areas').then((res) => setAreas(res.data.items)).catch(() => {});
  }, []);

  useEffect(() => {
    cartaService.stats().then((res) => setStats(res.data.stats)).catch(() => setStats(null));
  }, [reloadKey]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    cartaService
      .list({
        search: urlSearch, tipo: filters.tipo, estado: filters.estado, desde: filters.desde,
        hasta: filters.hasta, area_id: filters.area, page, limit: PAGE_SIZE,
      })
      .then((res) => !cancelled && setData(res.data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch, filters.tipo, filters.estado, filters.desde, filters.hasta, filters.area, page, reloadKey]);

  useEffect(() => {
    if (!loading && page > data.pagination.totalPages) {
      updateParams({ page: String(data.pagination.totalPages) }, { keepPage: true });
    }
  }, [loading, page, data.pagination.totalPages, updateParams]);

  const hasActiveFilters = useMemo(
    () => !!(urlSearch || filters.tipo || filters.estado || filters.desde || filters.hasta || filters.area),
    [urlSearch, filters.tipo, filters.estado, filters.desde, filters.hasta, filters.area]
  );

  const clearAll = () => {
    setSearchInput('');
    setSearchParams({}, { replace: true });
  };
  const reload = () => setReloadKey((k) => k + 1);
  const fmt = (n) => (stats ? n : '—');
  const byEstado = (estado) => ({ onClick: () => updateParams({ estado }), active: filters.estado === estado });

  const statCards = [
    { label: 'Total de cartas', value: fmt(stats?.total), icon: FileSignature, onClick: clearAll, active: !hasActiveFilters },
    { label: 'Borradores', value: fmt(stats?.borrador), icon: ScrollText, tone: 'default', ...byEstado('borrador') },
    { label: 'Pendientes de firma', value: stats ? stats.generada + stats.pendiente_firma : '—', icon: FileClock, tone: 'amber', ...byEstado('generada,pendiente_firma') },
    { label: 'Firmadas', value: fmt(stats?.firmada), icon: FileCheck, tone: 'green', ...byEstado('firmada') },
    { label: 'Canceladas', value: fmt(stats?.cancelada), icon: FileX, tone: 'red', ...byEstado('cancelada') },
  ];

  const { cartas, pagination } = data;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Cartas responsivas</h2>
          <p className="text-sm text-slate-500">Documentos de entrega de equipos y recursos a los colaboradores.</p>
        </div>
        <Link
          to="/cartas-responsivas/nueva"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-900 px-4 py-2.5 text-sm font-semibold text-oncolor transition-colors hover:bg-brand-800"
        >
          <FilePlus size={16} /> Nueva carta
        </Link>
      </div>

      <StatCardRow cards={statCards} cols={5} />

      <CartasFilters
        search={searchInput}
        onSearchChange={setSearchInput}
        filters={filters}
        onFilterChange={(key, value) => updateParams({ [key]: value })}
        onClear={clearAll}
        areas={areas}
        hasActiveFilters={hasActiveFilters || !!searchInput}
      />

      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center">
          <AlertCircle className="text-red-500" size={28} />
          <p className="text-sm text-red-700">No se pudo cargar la lista: {error}</p>
          <Button variant="secondary" icon={RotateCcw} onClick={reload}>Reintentar</Button>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl border border-slate-200 bg-white" />
          ))}
        </div>
      ) : cartas.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-900/5 text-brand-500">
            {hasActiveFilters ? <SearchX size={26} /> : <FileSignature size={26} />}
          </div>
          <h3 className="text-base font-semibold text-slate-800">
            {hasActiveFilters ? 'No se encontraron cartas' : 'Aún no hay cartas responsivas'}
          </h3>
          <p className="max-w-sm text-sm text-slate-500">
            {hasActiveFilters ? 'Prueba con otra búsqueda o quita algunos filtros.' : 'Genera la primera para documentar la entrega de un recurso.'}
          </p>
          {hasActiveFilters ? (
            <Button variant="secondary" onClick={clearAll}>Limpiar filtros</Button>
          ) : (
            <Link to="/cartas-responsivas/nueva" className="inline-flex items-center gap-2 rounded-lg bg-brand-900 px-4 py-2.5 text-sm font-semibold text-oncolor hover:bg-brand-800">
              <FilePlus size={16} /> Nueva carta
            </Link>
          )}
        </div>
      ) : (
        <>
          <CartasTable cartas={cartas} onChanged={reload} />
          <Pagination
            page={page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={PAGE_SIZE}
            onChange={(p) => updateParams({ page: String(p) }, { keepPage: true })}
          />
        </>
      )}
    </div>
  );
}
