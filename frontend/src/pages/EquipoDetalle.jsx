import InventarioDetalle from '../components/inventario/InventarioDetalle.jsx';
import EstadoInventarioBadge from '../components/inventario/EstadoInventarioBadge.jsx';
import EquipoPasswordField from '../components/inventario/EquipoPasswordField.jsx';
import { ESTADOS_FISICOS } from '../utils/inventarioConfig';
import { formatDate, todayISO } from '../utils/formatters';

function Componentes({ lista }) {
  if (!lista?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {lista.map((c) => (
        <span key={c} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{c}</span>
      ))}
    </div>
  );
}

// Ficha del equipo: informacion general, caracteristicas, red, compra/garantia y estado.
const sections = (e) => [
  {
    title: 'Información general',
    items: [
      { label: 'Código', value: e.codigo_inventario },
      { label: 'Tipo', value: e.tipo },
      { label: 'Marca', value: e.marca },
      { label: 'Modelo', value: e.modelo },
      { label: 'Número de serie', value: e.numero_serie, wide: true },
    ],
  },
  {
    title: 'Características',
    items: [
      { label: 'Procesador', value: e.procesador },
      { label: 'RAM', value: e.ram },
      { label: 'Disco', value: e.disco_duro },
      { label: 'Sistema operativo', value: e.sistema_operativo },
      { label: 'Tarjeta madre', value: e.tarjeta_madre },
      { label: 'Tarjeta gráfica', value: e.tarjeta_grafica },
      { label: 'Componentes adicionales', value: e.componentes_adicionales?.length ? <Componentes lista={e.componentes_adicionales} /> : null, wide: true },
    ],
  },
  {
    title: 'Red',
    items: [
      { label: 'Dirección MAC', value: e.mac_address },
      { label: 'Hostname', value: e.hostname },
    ],
  },
  {
    title: 'Acceso',
    items: [
      { label: 'Contraseña del equipo', value: <EquipoPasswordField equipo={e} />, wide: true },
    ],
  },
  {
    title: 'Compra y garantía',
    items: [
      { label: 'Fecha de compra', value: e.fecha_compra && formatDate(e.fecha_compra) },
      {
        label: 'Garantía vigente hasta',
        value: e.garantia_vence && `${formatDate(e.garantia_vence)}${e.garantia_vence < todayISO() ? ' (vencida)' : ''}`,
      },
      { label: 'Detalle de garantía', value: e.garantia_detalle, wide: true },
    ],
  },
  {
    title: 'Estado',
    items: [
      { label: 'Estado del equipo', value: <EstadoInventarioBadge estado={e.estado} /> },
      { label: 'Estado físico', value: ESTADOS_FISICOS[e.estado_fisico] },
      e.fecha_baja && { label: 'Fecha de baja', value: formatDate(e.fecha_baja) },
      { label: 'Observaciones e incidentes', value: e.observaciones && <span className="whitespace-pre-line">{e.observaciones}</span>, wide: true },
    ].filter(Boolean),
  },
];

export default function EquipoDetalle() {
  return <InventarioDetalle kind="equipos" sections={sections} />;
}
