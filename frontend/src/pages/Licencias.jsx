import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, AlertTriangle, Ban, CheckCircle2, KeyRound, Plus, RotateCcw, SearchX, XCircle } from 'lucide-react';
import StatCardRow from '../components/StatCardRow.jsx';
import Button from '../components/ui/Button.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import LicenciasTable from '../components/licencias/LicenciasTable.jsx';
import LicenciasFilters from '../components/licencias/LicenciasFilters.jsx';
import LicenciaForm from '../components/licencias/LicenciaForm.jsx';
import { useCan } from '../hooks/useCan';
import { useDebounce } from '../hooks/useDebounce';
import { licenciaService } from '../services/licenciaService';

const PAGE_SIZE = 12;

/** Licencias: cada contrato/compra de un software, con sus puestos y vencimientos. */
export default function Licencias() {
  const [searchParams, setSearchParams] = useSearchParams();
  const can = useCan();
  const canGestionar = can('licencias.gestionar');
  const verCostos = can('licencias.costos_ver');

  const urlSearch = searchParams.get('q') || '';
  const filters = { estado: searchParams.get('estado') || '' };
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebounce(searchInput);

  const [data, setData] = useState({ licencias: [], pagination: { total: 0, totalPages: 1 } });
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
    licenciaService.stats().then((res) => setStats(res.data.stats)).catch(() => setStats(null));
  }, [reloadKey]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    licenciaService
      .list({ search: urlSearch, estado: filters.estado, page, limit: PAGE_SIZE })
      .then((res) => !cancelled && setData(res.data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch, filters.estado, page, reloadKey]);

  useEffect(() => {
    if (!loading && page > data.pagination.totalPages) updateParams({ page: String(data.pagination.totalPages) }, { keepPage: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, data.pagination.totalPages]);

  const cards = [
    { label: 'Con puestos disponibles', value: stats?.con_disponibles ?? '—', icon: CheckCircle2, tone: 'green', estado: '' },
    { label: 'Por vencer', value: stats?.por_vencer ?? '—', icon: AlertTriangle, tone: 'amber', estado: 'por_vencer' },
    { label: 'Vencidas', value: stats?.vencidas ?? '—', icon: XCircle, tone: 'red', estado: 'vencida' },
    { label: 'Canceladas', value: stats?.canceladas ?? '—', icon: Ban, tone: 'default', estado: 'cancelada' },
  ].map((c) => ({
    ...c,
    active: !!c.estado && filters.estado === c.estado,
    onClick: c.estado ? () => updateParams({ estado: filters.estado === c.estado ? '' : c.estado }) : undefined,
  }));

  const guardado = () => { setModal(null); recargar(); };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Licencias</h2>
          <p className="text-sm text-slate-500">Contratos y compras de software: puestos, vigencia y asignaciones.</p>
        </div>
        {canGestionar && <Button icon={Plus} onClick={() => setModal({ tipo: 'form' })}>Registrar licencia</Button>}
      </div>

      <StatCardRow cards={cards} />

      <LicenciasFilters searchInput={searchInput} onSearch={setSearchInput} filters={filters} onChange={updateParams} />

      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center">
          <AlertCircle size={28} className="text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
          <Button variant="secondary" icon={RotateCcw} onClick={recargar}>Reintentar</Button>
        </div>
      ) : loading && !data.licencias.length ? (
        <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white" />
      ) : data.licencias.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <KeyRound size={28} className="text-slate-400" />
          <h3 className="text-base font-semibold text-slate-800">No hay licencias que coincidan</h3>
          <p className="text-sm text-slate-500">Prueba con otros filtros{canGestionar ? ' o registra una nueva' : ''}.</p>
          {searchInput === '' && filters.estado === '' && (
            <p className="text-xs text-slate-400">Puedes registrarlas también desde la ficha de cada software.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <LicenciasTable licencias={data.licencias} verCostos={verCostos} />
          <Pagination
            page={data.pagination.page} totalPages={data.pagination.totalPages} total={data.pagination.total} limit={data.pagination.limit}
            onChange={(p) => updateParams({ page: String(p) }, { keepPage: true })}
          />
        </div>
      )}

      {modal?.tipo === 'form' && <LicenciaForm licencia={modal.licencia} onClose={() => setModal(null)} onSaved={guardado} />}
    </div>
  );
}
