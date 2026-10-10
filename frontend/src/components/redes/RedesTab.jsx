import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Network, Plus, RotateCcw, SearchX, ShieldOff } from 'lucide-react';
import StatCardRow from '../StatCardRow.jsx';
import Button from '../ui/Button.jsx';
import Pagination from '../ui/Pagination.jsx';
import RedesTable from './RedesTable.jsx';
import RedesFilters from './RedesFilters.jsx';
import RedForm from './RedForm.jsx';
import { useCan } from '../../hooks/useCan';
import { useDebounce } from '../../hooks/useDebounce';
import { redService } from '../../services/redService';

const PAGE_SIZE = 12;

export default function RedesTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const can = useCan();
  const canCrear = can('redes.crear');

  const urlSearch = searchParams.get('q') || '';
  const filters = { tipo: searchParams.get('tipo') || '', estado: searchParams.get('estado') || '', ubicacion: searchParams.get('ubicacion') || '' };
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebounce(searchInput);
  const [data, setData] = useState({ redes: [], pagination: { total: 0, totalPages: 1 } });
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
    redService.stats().then((res) => setStats(res.data.stats)).catch(() => setStats(null));
  }, [reloadKey]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    redService
      .list({ search: urlSearch, tipo: filters.tipo, estado: filters.estado, ubicacion_id: filters.ubicacion, page, limit: PAGE_SIZE })
      .then((res) => !cancelled && setData(res.data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch, filters.tipo, filters.estado, filters.ubicacion, page, reloadKey]);

  useEffect(() => {
    if (!loading && page > data.pagination.totalPages) updateParams({ page: String(data.pagination.totalPages) }, { keepPage: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, data.pagination.totalPages]);

  const cards = [
    { label: 'Total de redes', value: stats?.total ?? '—', icon: Network, tone: 'default' },
    { label: 'Activas', value: stats?.activas ?? '—', icon: CheckCircle2, tone: 'green' },
    { label: 'Inactivas', value: stats?.inactivas ?? '—', icon: ShieldOff, tone: 'slate' },
  ];

  const guardado = () => { setModal(null); recargar(); };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <StatCardRow cards={cards} cols={4} />
      </div>
      {canCrear && (
        <div className="flex justify-end">
          <Button icon={Plus} onClick={() => setModal({ tipo: 'form' })}>Registrar red</Button>
        </div>
      )}

      <RedesFilters searchInput={searchInput} onSearch={setSearchInput} filters={filters} onChange={updateParams} />

      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center">
          <AlertCircle size={28} className="text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
          <Button variant="secondary" icon={RotateCcw} onClick={recargar}>Reintentar</Button>
        </div>
      ) : loading && !data.redes.length ? (
        <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white" />
      ) : data.redes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <SearchX size={28} className="text-slate-400" />
          <h3 className="text-base font-semibold text-slate-800">No hay redes que coincidan</h3>
          <p className="text-sm text-slate-500">Prueba con otros filtros{canCrear ? ' o registra una nueva' : ''}.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <RedesTable redes={data.redes} />
          <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} total={data.pagination.total} limit={data.pagination.limit} onChange={(p) => updateParams({ page: String(p) }, { keepPage: true })} />
        </div>
      )}

      {modal?.tipo === 'form' && <RedForm red={modal.red} onClose={() => setModal(null)} onSaved={guardado} />}
    </div>
  );
}
