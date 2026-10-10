import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, Boxes, CheckCircle2, Clock, KeyRound, RotateCcw,
  ShieldAlert, Users, Wrench,
} from 'lucide-react';
import StatCardRow from '../components/StatCardRow.jsx';
import Button from '../components/ui/Button.jsx';
import DashboardCard from '../components/dashboard/DashboardCard.jsx';
import AlertasList from '../components/dashboard/AlertasList.jsx';
import ProximosMantenimientos from '../components/dashboard/ProximosMantenimientos.jsx';
import GarantiasProximas from '../components/dashboard/GarantiasProximas.jsx';
import LicenciasResumen from '../components/dashboard/LicenciasResumen.jsx';
import EquiposDisponibles from '../components/dashboard/EquiposDisponibles.jsx';
import ActividadReciente from '../components/dashboard/ActividadReciente.jsx';
import BarRanking from '../components/reportes/BarRanking.jsx';
import { useAuth } from '../hooks/useAuth';
import { dashboardService } from '../services/dashboardService';
import { CATEGORICAL, ESTADO_COLOR, ESTADOS_ACTIVO } from '../utils/reportesConfig';

const ESTADO_ORDEN = ['disponible', 'asignado', 'mantenimiento', 'baja'];
const ESTADO_COLORES = { disponible: ESTADO_COLOR.good, asignado: CATEGORICAL[0], mantenimiento: ESTADO_COLOR.warning, baja: ESTADO_COLOR.critical };

/**
 * Dashboard principal: resumen general de la infraestructura TI, calculado en
 * el momento (nada aqui es un numero fijo). El orden de las secciones sigue
 * la prioridad pedida: resumen -> alertas -> proximas actividades -> analisis
 * visual -> actividad reciente.
 */
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    dashboardService.get()
      .then((res) => !cancelled && setData(res.data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [reloadKey]);

  if (loading && !data) {
    return (
      <div className="space-y-5">
        <div className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center">
        <AlertCircle size={28} className="text-red-500" />
        <p className="text-sm text-red-700">{error}</p>
        <Button variant="secondary" icon={RotateCcw} onClick={() => setReloadKey((k) => k + 1)}>Reintentar</Button>
      </div>
    );
  }

  const t = data.tarjetas;
  const ir = (path) => () => navigate(path);

  const cardsResumen = [
    { label: 'Total de activos', value: t.total_activos, icon: Boxes, tone: 'default' },
    { label: 'Equipos asignados', value: t.asignados, icon: CheckCircle2, tone: 'blue', onClick: ir('/equipos?estado=asignado') },
    { label: 'Equipos disponibles', value: t.disponibles, icon: Boxes, tone: 'green', onClick: ir('/equipos?estado=disponible') },
    { label: 'Equipos en mantenimiento', value: t.en_mantenimiento, icon: Wrench, tone: 'amber', onClick: ir('/equipos?estado=mantenimiento') },
    { label: 'Mantenimientos pendientes', value: t.mantenimientos_pendientes, icon: Clock, tone: 'amber', onClick: ir('/mantenimientos?vista=lista&estado=programado') },
  ];
  const cardsSecundarias = [
    t.colaboradores !== undefined && { label: 'Total de colaboradores', value: t.colaboradores, icon: Users, tone: 'default', onClick: ir('/colaboradores') },
    t.licencias_registradas !== undefined && { label: 'Licencias registradas', value: t.licencias_registradas, icon: KeyRound, tone: 'default', onClick: ir('/licencias') },
    t.licencias_disponibles !== undefined && { label: 'Licencias disponibles', value: t.licencias_disponibles, icon: KeyRound, tone: 'blue', onClick: ir('/licencias') },
    {
      label: 'Garantías próximas a vencer', value: t.garantias_por_vencer, icon: ShieldAlert, tone: 'amber',
      onClick: () => document.getElementById('garantias')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    },
  ].filter(Boolean);

  const estadoData = ESTADO_ORDEN.map((estado) => ({
    estado, label: ESTADOS_ACTIVO[estado],
    total: data.estadoInventario.find((e) => e.estado === estado)?.total || 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Dashboard</h2>
        <p className="text-sm text-slate-500">Resumen general de la infraestructura TI, {user?.name ? `hola ${user.name.split(' ')[0]}` : 'actualizado en tiempo real'}.</p>
      </div>

      {/* 1. Resumen general */}
      <StatCardRow cards={cardsResumen} cols={5} />
      <StatCardRow cards={cardsSecundarias} cols={4} />

      {/* 2. Alertas y problemas */}
      <DashboardCard title="Alertas y pendientes" description="Situaciones que requieren tu atención, de mayor a menor urgencia.">
        <AlertasList alertas={data.alertas} />
      </DashboardCard>

      {/* 3. Proximas actividades */}
      <DashboardCard
        title="Próximos mantenimientos"
        description="Los más cercanos en la agenda."
        action={<Button variant="secondary" onClick={ir('/mantenimientos?vista=lista')}>Ver todos</Button>}
      >
        <ProximosMantenimientos mantenimientos={data.proximosMantenimientos} />
      </DashboardCard>

      {/* 4. Analisis visual */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardCard title="Estado general del inventario" description="Todos los activos, según su situación actual.">
          <BarRanking data={estadoData} labelKey="label" valueKey="total" colors={estadoData.map((e) => ESTADO_COLORES[e.estado])} />
        </DashboardCard>
        <DashboardCard title="Inventario por categoría" description="Equipos, accesorios, monitores, impresoras, celulares y red.">
          <BarRanking data={data.inventarioPorCategoria} labelKey="label" valueKey="total" colors={CATEGORICAL} />
        </DashboardCard>
      </div>

      <DashboardCard id="garantias" title="Garantías próximas a vencer" description="Ordenadas por urgencia; las vencidas aparecen primero.">
        <GarantiasProximas items={data.garantiasProximas} />
      </DashboardCard>

      {data.licencias && (
        <DashboardCard title="Licencias" description="Puestos contratados y los que ya requieren atención.">
          <LicenciasResumen licencias={data.licencias} />
        </DashboardCard>
      )}

      <DashboardCard title="Equipos disponibles" description="Lo que hay listo para entregar hoy mismo.">
        <EquiposDisponibles disponibles={data.equiposDisponibles} />
      </DashboardCard>

      {/* 5. Actividad reciente */}
      <DashboardCard title="Actividad reciente" description="Últimas acciones registradas en el sistema.">
        <ActividadReciente actividad={data.actividadReciente} />
      </DashboardCard>
    </div>
  );
}
