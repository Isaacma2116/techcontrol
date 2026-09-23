import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, AlertTriangle, Plus, Router, RotateCcw, SearchX, ShieldOff, Wifi, WifiOff } from 'lucide-react';
import StatCardRow from '../StatCardRow.jsx';
import Button from '../ui/Button.jsx';
import Pagination from '../ui/Pagination.jsx';
import DispositivosTable from './DispositivosTable.jsx';
import DispositivosFilters from './DispositivosFilters.jsx';
import DispositivoRedForm from './DispositivoRedForm.jsx';
import { useCan } from '../../hooks/useCan';
import { useDebounce } from '../../hooks/useDebounce';
import { dispositivoRedService } from '../../services/dispositivoRedService';

const PAGE_SIZE = 12;

export default function DispositivosTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const can = useCan();
  const canCrear = can('dispositivos_red.crear');

  const urlSearch = searchParams.get('q') || '';
  const filters = {
    tipo: searchParams.get('tipo') || '', estado: searchParams.get('estado') || '',
    ubicacion: searchParams.get('ubicacion') || '', red: searchParams.get('red') || '',
  };
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebounce(searchInput);
  const [data, setData] = useState({ dispositivos: [], pagination: { total: 0, totalPages: 1 } });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [modal, setModal] = useState(null);

  const updateParams = useCallback((changes, { keepPage = false } = {}) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
      if (!keepPage) next.delete('page');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  useEffect(() => {
    if (debouncedSearch.trim() !== urlSearch) updateParams({ q: debouncedSearch.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const recargar = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    dispositivoRedService.stats().then((res) => setStats(res.data.stats)).catch(() => setStats(null));
  }, [reloadKey]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    dispositivoRedService
      .list({ search: urlSearch, tipo: filters.tipo, estado: filters.estado, ubicacion_id: filters.ubicacion, red_id: filters.red, page, limit: PAGE_SIZE })
      .then((res) => !cancelled && setData(res.data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch, filters.tipo, filters.estado, filters.ubicacion, filters.red, page, reloadKey]);

  useEffect(() => {
    if (!loading && page > data.pagination.totalPages) updateParams({ page: String(data.pagination.totalPages) }, { keepPage: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, data.pagination.totalPages]);

  const cards = [
    { label: 'Routers', value: stats?.routers ?? '—', icon: Router, tone: 'blue', estado: '', tipo: 'router' },
    { label: 'Switches', value: stats?.switches ?? '—', icon: Wifi, tone: 'blue', tipo: 'switch' },
    { label: 'Access Points', value: stats?.access_points ?? '—', icon: Wifi, tone: 'default', tipo: 'access_point' },
    { label: 'Firewalls', value: stats?.firewalls ?? '—', icon: ShieldOff, tone: 'default', tipo: 'firewall' },
    { label: 'En mantenimiento', value: stats?.en_mantenimiento ?? '—', icon: AlertTriangle, tone: 'amber', estado: 'mantenimiento' },
    { label: 'Inactivos', value: stats?.inactivos ?? '—', icon: WifiOff, tone: 'red', estado: 'inactivo' },
  ].map((c) => ({
    ...c,
    active: (c.tipo && filters.tipo === c.tipo) || (c.estado && filters.estado === c.estado),
    onClick: c.tipo
      ? () => updateParams({ tipo: filters.tipo === c.tipo ? '' : c.tipo })
      : c.estado
        ? () => updateParams({ estado: filters.estado === c.estado ? '' : c.estado })
        : undefined,
  }));

  const guardado = () => { setModal(null); recargar(); };

  return (
    <div className="space-y-5">
      <StatCardRow cards={cards} cols={4} />
      {canCrear && (
        <div className="flex justify-end">
          <Button icon={Plus} onClick={() => setModal({ tipo: 'form' })}>Registrar dispositivo</Button>
        </div>
      )}

      <DispositivosFilters searchInput={searchInput} onSearch={setSearchInput} filters={filters} onChange={updateParams} />

      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center">
          <AlertCircle size={28} className="text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
          <Button variant="secondary" icon={RotateCcw} onClick={recargar}>Reintentar</Button>
        </div>
      ) : loading && !data.dispositivos.length ? (
        <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white" />
      ) : data.dispositivos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <SearchX size={28} className="text-slate-400" />
          <h3 className="text-base font-semibold text-slate-800">No hay dispositivos que coincidan</h3>
          <p className="text-sm text-slate-500">Prueba con otros filtros{canCrear ? ' o registra uno nuevo' : ''}.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <DispositivosTable dispositivos={data.dispositivos} />
          <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} total={data.pagination.total} limit={data.pagination.limit} onChange={(p) => updateParams({ page: String(p) }, { keepPage: true })} />
        </div>
      )}

      {modal?.tipo === 'form' && <DispositivoRedForm dispositivo={modal.dispositivo} onClose={() => setModal(null)} onSaved={guardado} />}
    </div>
  );
}
