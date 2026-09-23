import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Boxes, CheckCircle2, UserCheck, Wrench, Archive, Plus, UserPlus, SearchX,
  AlertCircle, RotateCcw,
} from 'lucide-react';
import StatCardRow from '../StatCardRow.jsx';
import Button from '../ui/Button.jsx';
import Pagination from '../ui/Pagination.jsx';
import InventarioFilters from './InventarioFilters.jsx';
import InventarioTable from './InventarioTable.jsx';
import { FORMS } from './inventarioForms.js';
import AsignarModal from './AsignarModal.jsx';
import { useCanManage } from '../../hooks/useCanManage';
import { useDebounce } from '../../hooks/useDebounce';
import { catalogoService, colaboradorService } from '../../services/colaboradorService';
import { inventarioServices } from '../../services/inventarioService';
import { KINDS } from '../../utils/inventarioConfig';

const PAGE_SIZE = 12;

/**
 * Pantalla de listado generica de Equipos, Accesorios, Impresoras y Celulares
 * (kind = 'equipos' | 'accesorios' | 'impresoras' | 'celulares').
 * Busqueda, filtros y pagina viven en la URL para que al volver desde un
 * detalle se conserve lo que el usuario estaba viendo. El filtrado real lo
 * hace el backend en SQL.
 */
export default function InventarioListado({ kind }) {
  const cfg = KINDS[kind];
  const service = inventarioServices[kind];
  const canManage = useCanManage();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSearch = searchParams.get('q') || '';
  const filters = {
    tipo: searchParams.get('tipo') || '',
    estado: searchParams.get('estado') || '',
    asignacion: searchParams.get('asignacion') || '',
    marca: searchParams.get('marca') || '',
    colaborador: searchParams.get('colaborador') || '',
    ubicacion: searchParams.get('ubicacion') || '',
  };
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebounce(searchInput);

  const [data, setData] = useState({ items: [], pagination: { total: 0, totalPages: 1 } });
  const [stats, setStats] = useState(null);
  const [tipos, setTipos] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [colaborador, setColaborador] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [modal, setModal] = useState(null); // 'nuevo' | 'asignar' | null

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

  // Catalogos para los filtros.
  useEffect(() => {
    if (cfg.catalog) catalogoService.list(cfg.catalog).then((res) => setTipos(res.data.items)).catch(() => {});
    if (cfg.extraFilter === 'marca') service.marcas().then((res) => setMarcas(res.data.marcas)).catch(() => {});
    if (cfg.showUbicacion) catalogoService.list('ubicaciones').then((res) => setUbicaciones(res.data.items)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey, kind]);

  useEffect(() => {
    service.stats().then((res) => setStats(res.data.stats)).catch(() => setStats(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey, kind]);

  // El filtro por colaborador viaja como id en la URL; se resuelve su nombre para mostrarlo.
  useEffect(() => {
    if (!filters.colaborador) return setColaborador(null);
    if (colaborador && String(colaborador.id) === filters.colaborador) return undefined;
    let cancelled = false;
    colaboradorService
      .getById(filters.colaborador)
      .then((res) => !cancelled && setColaborador(res.data.colaborador))
      .catch(() => !cancelled && setColaborador(null));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.colaborador]);

  // Lista: se vuelve a consultar al backend cada vez que cambia un filtro o la pagina.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    service
      .list({
        search: urlSearch,
        tipo: filters.tipo,
        estado: filters.estado,
        asignacion: filters.asignacion,
        marca: filters.marca,
        colaborador_id: filters.colaborador,
        ubicacion_id: filters.ubicacion,
        page,
        limit: PAGE_SIZE,
      })
      .then((res) => !cancelled && setData(res.data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, urlSearch, filters.tipo, filters.estado, filters.asignacion, filters.marca, filters.colaborador, filters.ubicacion, page, reloadKey]);

  // Si la pagina quedo fuera de rango (p. ej. tras filtrar), regresa a la ultima valida.
  useEffect(() => {
    if (!loading && page > data.pagination.totalPages) {
      updateParams({ page: String(data.pagination.totalPages) }, { keepPage: true });
    }
  }, [loading, page, data.pagination.totalPages, updateParams]);

  const hasActiveFilters = useMemo(
    () => !!(urlSearch || filters.tipo || filters.estado || filters.asignacion || filters.marca || filters.colaborador || filters.ubicacion),
    [urlSearch, filters.tipo, filters.estado, filters.asignacion, filters.marca, filters.colaborador, filters.ubicacion]
  );

  const clearAll = () => {
    setSearchInput('');
    setSearchParams({}, { replace: true });
  };

  const reload = () => setReloadKey((k) => k + 1);
  const fmt = (n) => (stats ? n : '—');
  const byEstado = (estado) => ({ onClick: () => updateParams({ estado, asignacion: '' }), active: filters.estado === estado && !filters.asignacion });

  const statCards = [
    { label: `Total de ${cfg.plural}`, value: fmt(stats?.total), icon: Boxes, onClick: clearAll, active: !hasActiveFilters },
    { label: 'Disponibles', value: fmt(stats?.disponible), icon: CheckCircle2, tone: 'blue', ...byEstado('disponible') },
    { label: `Asignad${cfg.o}s`, value: fmt(stats?.asignado), icon: UserCheck, tone: 'green', ...byEstado('asignado') },
    ...(cfg.showMantenimiento
      ? [{
          label: 'En mantenimiento',
          value: stats ? stats.mantenimiento + stats.reparacion : '—',
          icon: Wrench,
          tone: 'amber',
          ...byEstado('mantenimiento,reparacion'),
        }]
      : []),
    { label: 'Baja', value: fmt(stats?.baja), icon: Archive, tone: 'red', ...byEstado('baja') },
  ];

  const { items, pagination } = data;
  const { Form, prop: formPropName } = FORMS[kind];
  const formProp = { [formPropName]: null };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">{cfg.Plural}</h2>
          <p className="text-sm text-slate-500">{cfg.description}</p>
        </div>
        {canManage && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" icon={UserPlus} onClick={() => setModal('asignar')}>
              Asignar {cfg.singular}
            </Button>
            <Button icon={Plus} onClick={() => setModal('nuevo')}>
              Nuev{cfg.o} {cfg.singular}
            </Button>
          </div>
        )}
      </div>

      <StatCardRow cards={statCards} cols={cfg.showMantenimiento ? 5 : 4} />

      <InventarioFilters
        kind={kind}
        search={searchInput}
        onSearchChange={setSearchInput}
        filters={filters}
        onFilterChange={(key, value) => updateParams({ [key]: value })}
        colaborador={colaborador}
        onColaboradorChange={(c) => {
          setColaborador(c);
          updateParams({ colaborador: c ? String(c.id) : '' });
        }}
        onClear={clearAll}
        tipos={tipos}
        marcas={marcas}
        ubicaciones={ubicaciones}
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
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl border border-slate-200 bg-white" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-900/5 text-brand-500">
            {hasActiveFilters ? <SearchX size={26} /> : <cfg.icon size={26} />}
          </div>
          <h3 className="text-base font-semibold text-slate-800">
            {hasActiveFilters ? `No se encontraron ${cfg.plural}` : `Aún no hay ${cfg.plural}`}
          </h3>
          <p className="max-w-sm text-sm text-slate-500">
            {hasActiveFilters
              ? 'Prueba con otra búsqueda o quita algunos filtros.'
              : canManage ? `Registra ${cfg.o === 'a' ? 'la primera' : 'el primero'} para comenzar tu inventario.` : `Todavía no se ha registrado ning${cfg.o === 'a' ? 'una' : 'uno'}.`}
          </p>
          {hasActiveFilters ? (
            <Button variant="secondary" onClick={clearAll}>Limpiar filtros</Button>
          ) : (
            canManage && <Button icon={Plus} onClick={() => setModal('nuevo')}>Nuev{cfg.o} {cfg.singular}</Button>
          )}
        </div>
      ) : (
        <>
          <InventarioTable kind={kind} items={items} />
          <Pagination
            page={page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={PAGE_SIZE}
            onChange={(p) => updateParams({ page: String(p) }, { keepPage: true })}
          />
        </>
      )}

      {modal === 'nuevo' && (
        <Form
          {...formProp}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            reload();
          }}
        />
      )}
      {modal === 'asignar' && (
        <AsignarModal
          kind={kind}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
