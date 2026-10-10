import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle, CalendarClock, CalendarDays, CalendarPlus, CalendarX, CheckCircle2, List, Loader2, RotateCcw, SearchX,
} from 'lucide-react';
import StatCardRow from '../components/StatCardRow.jsx';
import Button from '../components/ui/Button.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import CalendarioMes from '../components/mantenimientos/CalendarioMes.jsx';
import DiaPanel from '../components/mantenimientos/DiaPanel.jsx';
import MantenimientosTable from '../components/mantenimientos/MantenimientosTable.jsx';
import MantenimientosFilters from '../components/mantenimientos/MantenimientosFilters.jsx';
import MantenimientoModales from '../components/mantenimientos/MantenimientoModales.jsx';
import { useCanManage } from '../hooks/useCanManage';
import { useDebounce } from '../hooks/useDebounce';
import { mantenimientoService } from '../services/mantenimientoService';
import { mesISO, rangoMes } from '../utils/calendario';

const PAGE_SIZE = 12;

/**
 * Mantenimientos preventivos y correctivos: calendario mensual (por defecto) o
 * listado. La vista, el mes, el dia elegido y los filtros viven en la URL, asi
 * que la pantalla se puede compartir y el boton "atras" funciona.
 */
export default function Mantenimientos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const canManage = useCanManage();

  const vista = searchParams.get('vista') === 'lista' ? 'lista' : 'calendario';
  const mes = searchParams.get('mes') || mesISO();
  const dia = searchParams.get('dia') || '';
  const urlSearch = searchParams.get('q') || '';
  const filters = {
    tipo: searchParams.get('tipo') || '',
    estado: searchParams.get('estado') || '',
    prioridad: searchParams.get('prioridad') || '',
    unidad: searchParams.get('unidad') || '',
  };
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebounce(searchInput);

  const [data, setData] = useState({ mantenimientos: [], pagination: { total: 0, totalPages: 1 } });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // modal: { tipo: 'form'|'detalle'|'realizar'|'reprogramar'|'cancelar', ... }
  const [modal, setModal] = useState(null);

  const updateParams = useCallback(
    (changes, { keepPage = false } = {}) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
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

  const recargar = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    mantenimientoService.stats().then((res) => setStats(res.data.stats)).catch(() => setStats(null));
  }, [reloadKey]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const rango = vista === 'calendario' ? rangoMes(mes) : {};
    mantenimientoService
      .list({
        ...rango,
        search: urlSearch,
        tipo: filters.tipo,
        estado: filters.estado,
        prioridad: filters.prioridad,
        tipo_recurso: filters.unidad,
        ...(vista === 'lista' ? { page, limit: PAGE_SIZE } : {}),
      })
      .then((res) => !cancelled && setData(res.data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista, mes, urlSearch, filters.tipo, filters.estado, filters.prioridad, filters.unidad, page, reloadKey]);

  const delDia = useMemo(
    () => data.mantenimientos.filter((m) => m.fecha_programada === dia),
    [data.mantenimientos, dia]
  );

  const cards = [
    { label: 'Programados', value: stats?.programados ?? '—', icon: CalendarClock, tone: 'blue', estado: 'programado' },
    { label: 'Vencidos', value: stats?.vencidos ?? '—', icon: CalendarX, tone: 'red', estado: 'vencido' },
    { label: 'En proceso', value: stats?.en_proceso ?? '—', icon: Loader2, tone: 'amber', estado: 'en_proceso' },
    { label: 'Realizados este mes', value: stats?.realizados_mes ?? '—', icon: CheckCircle2, tone: 'green', estado: 'realizado' },
  ].map((c) => ({
    ...c,
    active: filters.estado === c.estado,
    onClick: () => updateParams({ estado: filters.estado === c.estado ? '' : c.estado }),
  }));

  // Tras crear / editar / cerrar: se recarga y, si cambio de mes, el calendario lo sigue.
  const guardado = (mantenimiento) => {
    setModal(null);
    if (mantenimiento?.fecha_programada) {
      const suMes = mantenimiento.fecha_programada.slice(0, 7);
      updateParams(suMes !== mes ? { mes: suMes, dia: mantenimiento.fecha_programada } : { dia: mantenimiento.fecha_programada });
    }
    recargar();
  };

  const vistaBtn = (valor, label, Icon) => (
    <button
      type="button"
      onClick={() => updateParams({ vista: valor === 'calendario' ? '' : valor })}
      aria-pressed={vista === valor}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors
        ${vista === valor ? 'bg-white text-brand-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
    >
      <Icon size={16} /> {label}
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Mantenimientos</h2>
          <p className="text-sm text-slate-500">
            Agenda los mantenimientos preventivos y correctivos, y registra lo que se hizo en cada uno.
          </p>
        </div>
        {canManage && (
          <Button icon={CalendarPlus} onClick={() => setModal({ tipo: 'form', fecha: dia || undefined })}>
            Agendar mantenimiento
          </Button>
        )}
      </div>

      <StatCardRow cards={cards} />

      <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 sm:w-fit">
        {vistaBtn('calendario', 'Calendario', CalendarDays)}
        {vistaBtn('lista', 'Lista', List)}
      </div>

      <MantenimientosFilters
        searchInput={searchInput}
        onSearch={setSearchInput}
        filters={filters}
        onChange={updateParams}
      />

      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center">
          <AlertCircle size={28} className="text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
          <Button variant="secondary" icon={RotateCcw} onClick={recargar}>Reintentar</Button>
        </div>
      ) : vista === 'calendario' ? (
        <div className="space-y-5">
          <CalendarioMes
            mes={mes}
            mantenimientos={data.mantenimientos}
            diaSeleccionado={dia}
            loading={loading}
            canManage={canManage}
            onMes={(nuevo) => updateParams({ mes: nuevo, dia: '' })}
            onDia={(iso) => updateParams({ dia: iso === dia ? '' : iso })}
            onAbrir={(m) => setModal({ tipo: 'detalle', id: m.id })}
            onAgendar={(fecha) => setModal({ tipo: 'form', fecha })}
          />
          <DiaPanel
            dia={dia}
            mantenimientos={delDia}
            canManage={canManage}
            onAbrir={(m) => setModal({ tipo: 'detalle', id: m.id })}
            onAgendar={(fecha) => setModal({ tipo: 'form', fecha })}
          />
        </div>
      ) : loading && !data.mantenimientos.length ? (
        <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white" />
      ) : data.mantenimientos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <SearchX size={28} className="text-slate-400" />
          <h3 className="text-base font-semibold text-slate-800">No hay mantenimientos que coincidan</h3>
          <p className="text-sm text-slate-500">Prueba con otros filtros o agenda uno nuevo.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <MantenimientosTable
            mantenimientos={data.mantenimientos}
            onAbrir={(m) => setModal({ tipo: 'detalle', id: m.id })}
          />
          <Pagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            total={data.pagination.total}
            limit={data.pagination.limit}
            onChange={(p) => updateParams({ page: String(p) }, { keepPage: true })}
          />
        </div>
      )}

      <MantenimientoModales
        modal={modal}
        setModal={setModal}
        onGuardado={guardado}
        onCambio={recargar}
        canManage={canManage}
      />
    </div>
  );
}
