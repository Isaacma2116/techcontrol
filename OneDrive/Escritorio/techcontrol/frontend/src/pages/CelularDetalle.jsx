import InventarioDetalle from '../components/inventario/InventarioDetalle.jsx';
import EstadoInventarioBadge from '../components/inventario/EstadoInventarioBadge.jsx';
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

// Ficha del celular. No hay PIN ni contraseñas: el inventario no las guarda.
const sections = (c) => [
  {
    title: 'Información general',
    items: [
      { label: 'Código', value: c.codigo_inventario },
      { label: 'Marca', value: c.marca },
      { label: 'Modelo', value: c.modelo },
      { label: 'Color', value: c.color },
      { label: 'Número de serie', value: c.numero_serie || <span className="text-slate-400">Sin número de serie</span>, wide: true },
      { label: 'IMEI 1', value: c.imei_1 },
      { label: 'IMEI 2', value: c.imei_2 },
    ],
  },
  {
    title: 'Características',
    items: [
      { label: 'Sistema operativo', value: c.sistema_operativo },
      { label: 'Almacenamiento', value: c.almacenamiento },
      { label: 'RAM', value: c.ram },
      { label: 'Componentes adicionales', value: c.componentes_adicionales?.length ? <Componentes lista={c.componentes_adicionales} /> : null, wide: true },
    ],
  },
  {
    title: 'Línea telefónica',
    items: [
      { label: 'Número de teléfono', value: c.numero_telefono },
      { label: 'Operador', value: c.operador },
      { label: 'Cuenta asociada', value: c.correo_asociado, wide: true },
    ],
  },
  {
    title: 'Compra, renovación y garantía',
    items: [
      { label: 'Fecha de compra', value: c.fecha_compra && formatDate(c.fecha_compra) },
      { label: 'Fecha de renovación', value: c.fecha_renovacion && formatDate(c.fecha_renovacion) },
      {
        label: 'Garantía vigente hasta',
        value: c.garantia_vence && `${formatDate(c.garantia_vence)}${c.garantia_vence < todayISO() ? ' (vencida)' : ''}`,
      },
      { label: 'Detalle de garantía', value: c.garantia_detalle, wide: true },
    ],
  },
  {
    title: 'Estado',
    items: [
      { label: 'Estado del celular', value: <EstadoInventarioBadge estado={c.estado} /> },
      c.fecha_baja && { label: 'Fecha de baja', value: formatDate(c.fecha_baja) },
      { label: 'Observaciones', value: c.observaciones && <span className="whitespace-pre-line">{c.observaciones}</span>, wide: true },
    ].filter(Boolean),
  },
];

export default function CelularDetalle() {
  return <InventarioDetalle kind="celulares" sections={sections} />;
}
