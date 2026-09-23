import InventarioDetalle from '../components/inventario/InventarioDetalle.jsx';
import EstadoInventarioBadge from '../components/inventario/EstadoInventarioBadge.jsx';
import { formatDate, todayISO } from '../utils/formatters';

// Ficha del accesorio.
const sections = (a) => [
  {
    title: 'Información general',
    items: [
      { label: 'Código', value: a.codigo_inventario },
      { label: 'Tipo', value: a.tipo },
      { label: 'Nombre', value: a.nombre, wide: true },
      { label: 'Marca', value: a.marca },
      { label: 'Modelo', value: a.modelo },
      { label: 'Número de serie', value: a.numero_serie || <span className="text-slate-400">Sin número de serie</span>, wide: true },
    ],
  },
  {
    title: 'Compra y garantía',
    items: [
      { label: 'Fecha de compra', value: a.fecha_compra && formatDate(a.fecha_compra) },
      {
        label: 'Garantía vigente hasta',
        value: a.garantia_vence && `${formatDate(a.garantia_vence)}${a.garantia_vence < todayISO() ? ' (vencida)' : ''}`,
      },
    ],
  },
  {
    title: 'Estado',
    items: [
      { label: 'Estado del accesorio', value: <EstadoInventarioBadge estado={a.estado} /> },
      a.fecha_baja && { label: 'Fecha de baja', value: formatDate(a.fecha_baja) },
      { label: 'Observaciones', value: a.observaciones && <span className="whitespace-pre-line">{a.observaciones}</span>, wide: true },
    ].filter(Boolean),
  },
];

export default function AccesorioDetalle() {
  return <InventarioDetalle kind="accesorios" sections={sections} />;
}
