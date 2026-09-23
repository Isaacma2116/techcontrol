import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, AlertTriangle, Boxes, Gift, Plus, RotateCcw, SearchX, XCircle } from 'lucide-react';
import StatCardRow from '../components/StatCardRow.jsx';
import Button from '../components/ui/Button.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import SoftwareTable from '../components/software/SoftwareTable.jsx';
import SoftwareFilters from '../components/software/SoftwareFilters.jsx';
import SoftwareForm from '../components/software/SoftwareForm.jsx';
import { useCan } from '../hooks/useCan';
import { useDebounce } from '../hooks/useDebounce';
import { softwareService } from '../services/softwareService';

const PAGE_SIZE = 12;

/** Catálogo de software: el programa, no una licencia especifica. */
export default function Software() {
  const [searchParams, setSearchParams] = useSearchParams();
  const can = useCan();
  const canGestionar = can('software.gestionar');
  const canVerLicencias = can('licencias.ver');

  const urlSearch = searchParams.get('q') || '';
  const filters = {
    tipo: searchParams.get('tipo') || '',
    categoria: searchParams.get('categoria') || '',
    requiere_licencia: searchParams.get('requiere_licencia') || '',
    estado: searchParams.get('estado') || '',
  };
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebounce(searchInput);

  const [data, setData] = useState({ software: [], pagination: { total: 0, totalPages: 1 } });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [modal, setModal] = useState(null);

  const updateParams = useCallback(
    (changes, { keepPage = false } = {}) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
        if (!keepPage) next.delete('page');
        return next;
      }, { replace: true });
    },
    [setSearchParams]
  );

  useEffect(() => {
    if (debouncedSearch.trim() !== urlSearch) updateParams({ q: debouncedSearch.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const recargar = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    softwareService.stats().then((res) => setStats(res.data.stats)).catch(() => setStats(null));
  }, [reloadKey]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    softwareService
      .list({
        search: urlSearch, tipo: filters.tipo, categoria_id: filters.categoria,
        requiere_licencia: filters.requiere_licencia, estado: filters.estado, page, limit: PAGE_SIZE,
      })
      .then((res) => !cancelled && setData(res.data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch, filters.tipo, filters.categoria, filters.requiere_licencia, filters.estado, page, reloadKey]);

  useEffect(() => {
    if (!loading && page > data.pagination.totalPages) updateParams({ page: String(data.pagination.totalPages) }, { keepPage: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, data.pagination.totalPages]);

  const cards = [
    { label: 'Software registrado', value: stats?.total ?? '—', icon: Boxes, tone: 'default' },
    { label: 'Gratuito / sin licencia', value: stats?.gratuito ?? '—', icon: Gift, tone: 'blue' },
    ...(canVerLicencias
      ? [
          { label: 'Con licencias vencidas', value: stats?.con_vencidas ?? '—', icon: XCircle, tone: 'red' },
          { label: 'Con licencias por vencer', value: stats?.con_por_vencer ?? '—', icon: AlertTriangle, tone: 'amber' },
        ]
      : []),
  ];

  const guardado = () => { setModal(null); recargar(); };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Software</h2>
          <p className="text-sm text-slate-500">Catálogo de programas instalables. Cada uno puede tener una o varias licencias.</p>
        </div>
        {canGestionar && <Button icon={Plus} onClick={() => setModal({ tipo: 'form' })}>Registrar software</Button>}
      </div>

      <StatCardRow cards={cards} cols={canVerLicencias ? 4 : 2} />

      <SoftwareFilters searchInput={searchInput} onSearch={setSearchInput} filters={filters} onChange={updateParams} />

      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center">
          <AlertCircle size={28} className="text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
          <Button variant="secondary" icon={RotateCcw} onClick={recargar}>Reintentar</Button>
        </div>
      ) : loading && !data.software.length ? (
        <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white" />
      ) : data.software.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <SearchX size={28} className="text-slate-400" />
          <h3 className="text-base font-semibold text-slate-800">No hay software que coincida</h3>
          <p className="text-sm text-slate-500">Prueba con otros filtros{canGestionar ? ' o registra uno nuevo' : ''}.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <SoftwareTable software={data.software} canVerLicencias={canVerLicencias} />
          <Pagination
            page={data.pagination.page} totalPages={data.pagination.totalPages} total={data.pagination.total} limit={data.pagination.limit}
            onChange={(p) => updateParams({ page: String(p) }, { keepPage: true })}
          />
        </div>
      )}

      {modal?.tipo === 'form' && <SoftwareForm software={modal.software} onClose={() => setModal(null)} onSaved={guardado} />}
    </div>
  );
}
