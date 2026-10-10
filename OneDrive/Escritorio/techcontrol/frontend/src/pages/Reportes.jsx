import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle, Boxes, CheckCircle2, Download, FileSpreadsheet, FileText, KeyRound,
  RotateCcw, Router, Users, Wrench, XCircle,
} from 'lucide-react';
import StatCardRow from '../components/StatCardRow.jsx';
import Button from '../components/ui/Button.jsx';
import FiltrosReporte from '../components/reportes/FiltrosReporte.jsx';
import BarRanking from '../components/reportes/BarRanking.jsx';
import MantenimientosChart from '../components/reportes/MantenimientosChart.jsx';
import Meter from '../components/reportes/Meter.jsx';
import EstadoBarras from '../components/reportes/EstadoBarras.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { reporteService } from '../services/reporteService';
import { CATEGORICAL, SEQUENTIAL, TIPO_ACTIVO_LABEL } from '../utils/reportesConfig';

const FILTROS_VACIOS = { desde: '', hasta: '', departamento_id: '', ubicacion_id: '', tipo_activo: '', estado: '' };

function ChartCard({ title, description, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

/**
 * Reportes y Analisis: dashboard consolidado de todos los modulos. Todo lo
 * que se ve aqui se calcula en el momento con SQL (nada se duplica): los
 * filtros de arriba alcanzan a cada tarjeta y cada grafico.
 */
export default function Reportes() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const filtros = Object.fromEntries(Object.keys(FILTROS_VACIOS).map((k) => [k, searchParams.get(k) || '']));

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportando, setExportando] = useState(null); // 'pdf' | 'excel' | null

  const updateFiltros = useCallback((changes) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    reporteService.dashboard(filtros)
      .then((res) => !cancelled && setData(res.data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filtros)]);

  const exportar = async (formato) => {
    setExportando(formato);
    try {
      await reporteService.exportar(formato, filtros);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExportando(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-5">
        <div className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white" />
        <div className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center">
        <AlertCircle size={28} className="text-red-500" />
        <p className="text-sm text-red-700">{error}</p>
        <Button variant="secondary" icon={RotateCcw} onClick={() => setSearchParams((p) => new URLSearchParams(p), { replace: true })}>Reintentar</Button>
      </div>
    );
  }

  const activosCards = [
    { label: 'Total de activos', value: data.activos.total, icon: Boxes, tone: 'default' },
    { label: 'Asignados', value: data.activos.asignados, icon: CheckCircle2, tone: 'green' },
    { label: 'Disponibles', value: data.activos.disponibles, icon: Boxes, tone: 'blue' },
    { label: 'En mantenimiento', value: data.activos.en_mantenimiento, icon: Wrench, tone: 'amber' },
    { label: 'Dados de baja', value: data.activos.de_baja, icon: XCircle, tone: 'red' },
  ];
  const otrasCards = [
    { label: 'Colaboradores', value: data.activos.colaboradores, icon: Users, tone: 'default' },
    { label: 'Licencias usadas', value: `${data.licencias.utilizadas} / ${data.licencias.total}`, icon: KeyRound, tone: 'blue' },
    { label: 'Dispositivos de red activos', value: data.dispositivosRed.resumen.activos, icon: Router, tone: 'green' },
    { label: 'Garantías vencidas', value: data.garantias.vencidas, icon: AlertCircle, tone: 'red' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Reportes y análisis</h2>
          <p className="text-sm text-slate-500">Vista consolidada de todos los módulos, calculada en tiempo real.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={FileText} loading={exportando === 'pdf'} onClick={() => exportar('pdf')}>PDF</Button>
          <Button variant="secondary" icon={FileSpreadsheet} loading={exportando === 'excel'} onClick={() => exportar('excel')}>Excel</Button>
        </div>
      </div>

      <FiltrosReporte filtros={filtros} onChange={updateFiltros} />

      <div className={loading ? 'space-y-5 opacity-60 transition-opacity' : 'space-y-5 transition-opacity'}>
        <StatCardRow cards={activosCards} cols={5} />
        <StatCardRow cards={otrasCards} cols={4} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title="Distribución de activos por tipo" description="Equipos, accesorios, impresoras y celulares.">
            <BarRanking data={data.activosPorTipo.map((r) => ({ ...r, label: TIPO_ACTIVO_LABEL[r.tipo] }))} labelKey="label" valueKey="total" colors={CATEGORICAL} />
          </ChartCard>

          <ChartCard title="Activos por departamento" description="Según el área del colaborador responsable.">
            <BarRanking data={data.activosPorDepartamento} labelKey="departamento" valueKey="total" colors={SEQUENTIAL} />
          </ChartCard>

          <ChartCard title="Activos por ubicación" description="Solo impresoras tienen una ubicación física propia en el sistema.">
            <BarRanking data={data.activosPorUbicacion} labelKey="ubicacion" valueKey="total" colors={SEQUENTIAL} emptyMessage="No hay impresoras para los filtros aplicados." />
          </ChartCard>

          <ChartCard title="Estado de garantías" description={`Por vencer = vence dentro de los próximos 60 días.`}>
            <EstadoBarras data={data.garantias} />
          </ChartCard>

          <ChartCard title="Uso de licencias" description="Puestos utilizados frente al total contratado (licencias activas).">
            <Meter utilizadas={data.licencias.utilizadas} total={data.licencias.total} />
          </ChartCard>

          <ChartCard title="Dispositivos de red por tipo" description="Routers, switches, access points y demás.">
            <BarRanking data={data.dispositivosRed.porTipo} labelKey="tipo" valueKey="total" colors={SEQUENTIAL} emptyMessage="No hay dispositivos de red registrados." />
          </ChartCard>
        </div>

        <ChartCard title="Mantenimientos por periodo" description="Preventivos contra correctivos, por mes.">
          <MantenimientosChart data={data.mantenimientos.porPeriodo} />
        </ChartCard>
      </div>
    </div>
  );
}
