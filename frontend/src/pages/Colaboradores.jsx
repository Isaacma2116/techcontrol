import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, UserCheck, UserX, Laptop, UserPlus, SearchX, AlertCircle, RotateCcw } from 'lucide-react';
import StatCardRow from '../components/StatCardRow.jsx';
import Button from '../components/ui/Button.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import ColaboradorCard, { ColaboradorCardSkeleton } from '../components/colaboradores/ColaboradorCard.jsx';
import ColaboradoresFilters from '../components/colaboradores/ColaboradoresFilters.jsx';
import ColaboradorForm from '../components/colaboradores/ColaboradorForm.jsx';
import { catalogoService, colaboradorService } from '../services/colaboradorService';
import { useDebounce } from '../hooks/useDebounce';

const PAGE_SIZE = 12;

/**
 * Listado de colaboradores. Busqueda, filtros y pagina viven en la URL
 * (?q=&area=&cargo=&estado=&equipo=&page=) para que al volver desde un
 * perfil se conserve exactamente lo que el usuario estaba viendo.
 * El filtrado real lo hace el backend en SQL.
 */
export default function Colaboradores() {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSearch = searchParams.get('q') || '';
  const filters = {
    area: searchParams.get('area') || '',
    cargo: searchParams.get('cargo') || '',
    estado: searchParams.get('estado') || '',
    equipo: searchParams.get('equipo') || '',
  };
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebounce(searchInput);

  const [data, setData] = useState({ colaboradores: [], pagination: { total: 0, totalPages: 1 } });
  const [stats, setStats] = useState(null);
  const [areas, setAreas] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);

  const updateParams = useCallback(
    (changes, { keepPage = false } = {}) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(changes).forEach(([key, value]) => {
            if (value) next.set(key, value);
            else next.delete(key);
          });
          if (!keepPage) next.delete('page');
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // El texto de busqueda pasa a la URL con retraso, para no consultar por cada tecla.
  useEffect(() => {
    if (debouncedSearch.trim() !== urlSearch) updateParams({ q: debouncedSearch.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Catalogos para los selects de filtro.
  useEffect(() => {
    Promise.all([catalogoService.list('areas'), catalogoService.list('cargos')])
      .then(([a, c]) => {
        setAreas(a.data.items);
        setCargos(c.data.items);
      })
      .catch(() => {}); // sin catalogos los filtros quedan vacios; la lista sigue funcionando
  }, [reloadKey]);

  useEffect(() => {
    colaboradorService
      .stats()
      .then((res) => setStats(res.data.stats))
      .catch(() => setStats(null));
  }, [reloadKey]);

  // Lista: se vuelve a consultar al backend cada vez que cambia un filtro o la pagina.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    colaboradorService
      .list({
        search: urlSearch,
        area_id: filters.area,
        cargo_id: filters.cargo,
        activo: filters.estado === 'activo' ? 'true' : filters.estado === 'inactivo' ? 'false' : '',
        asignacion: filters.equipo,
        page,
        limit: PAGE_SIZE,
      })
      .then((res) => !cancelled && setData(res.data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch, filters.area, filters.cargo, filters.estado, filters.equipo, page, reloadKey]);

  // Si la pagina quedo fuera de rango (p. ej. tras filtrar), regresa a la ultima valida.
  useEffect(() => {
    if (!loading && page > data.pagination.totalPages) {
      updateParams({ page: String(data.pagination.totalPages) }, { keepPage: true });
    }
  }, [loading, page, data.pagination.totalPages, updateParams]);

  const hasActiveFilters = useMemo(
    () => !!(urlSearch || filters.area || filters.cargo || filters.estado || filters.equipo),
    [urlSearch, filters.area, filters.cargo, filters.estado, filters.equipo]
  );

  const clearAll = () => {
    setSearchInput('');
    setSearchParams({}, { replace: true });
  };

  const applyStatFilter = (estado, equipo) => {
    updateParams({ estado, equipo });
  };

  const { colaboradores, pagination } = data;
  const fmt = (n) => (stats ? n : '—');

  const statCards = [
    {
      label: 'Total de colaboradores',
      value: fmt(stats?.total),
      icon: Users,
      onClick: clearAll,
      active: !hasActiveFilters,
    },
    {
      label: 'Activos',
      value: fmt(stats?.activos),
      icon: UserCheck,
      tone: 'green',
      onClick: () => applyStatFilter('activo', ''),
      active: filters.estado === 'activo' && !filters.equipo,
    },
    {
      label: 'Inactivos',
      value: fmt(stats?.inactivos),
      icon: UserX,
      tone: 'red',
      onClick: () => applyStatFilter('inactivo', ''),
      active: filters.estado === 'inactivo' && !filters.equipo,
    },
    {
      label: 'Activos sin equipo asignado',
      value: fmt(stats?.sin_equipo),
      icon: Laptop,
      tone: 'amber',
      onClick: () => applyStatFilter('activo', 'sin'),
      active: filters.estado === 'activo' && filters.equipo === 'sin',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Colaboradores</h2>
          <p className="text-sm text-slate-500">
            Personal de la empresa y los equipos que tienen a su cargo.
          </p>
        </div>
        <Button icon={UserPlus} onClick={() => setFormOpen(true)}>
          Nuevo colaborador
        </Button>
      </div>

      <StatCardRow cards={statCards} />

      <ColaboradoresFilters
        search={searchInput}
        onSearchChange={setSearchInput}
        filters={filters}
        onFilterChange={(key, value) => updateParams({ [key]: value })}
        onClear={clearAll}
        areas={areas}
        cargos={cargos}
        hasActiveFilters={hasActiveFilters || !!searchInput}
      />

      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center">
          <AlertCircle className="text-red-500" size={28} />
          <p className="text-sm text-red-700">No se pudo cargar la lista: {error}</p>
          <Button variant="secondary" icon={RotateCcw} onClick={() => setReloadKey((k) => k + 1)}>
            Reintentar
          </Button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <ColaboradorCardSkeleton key={i} />
          ))}
        </div>
      ) : colaboradores.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-900/5 text-brand-500">
            {hasActiveFilters ? <SearchX size={26} /> : <Users size={26} />}
          </div>
          <h3 className="text-base font-semibold text-slate-800">
            {hasActiveFilters ? 'No se encontraron colaboradores' : 'Aún no hay colaboradores'}
          </h3>
          <p className="max-w-sm text-sm text-slate-500">
            {hasActiveFilters
              ? 'Prueba con otra búsqueda o quita algunos filtros.'
              : 'Registra al primero para comenzar a asignarle equipos.'}
          </p>
          {hasActiveFilters ? (
            <Button variant="secondary" onClick={clearAll}>Limpiar filtros</Button>
          ) : (
            <Button icon={UserPlus} onClick={() => setFormOpen(true)}>Nuevo colaborador</Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {colaboradores.map((c) => (
              <ColaboradorCard key={c.id} colaborador={c} />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={PAGE_SIZE}
            onChange={(p) => updateParams({ page: String(p) }, { keepPage: true })}
          />
        </>
      )}

      {formOpen && (
        <ColaboradorForm
          colaborador={null}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            setReloadKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
