import InventarioDetalle from '../components/inventario/InventarioDetalle.jsx';
import EstadoInventarioBadge from '../components/inventario/EstadoInventarioBadge.jsx';
import { TIPOS_CONEXION } from '../utils/inventarioConfig';
import { formatDate, todayISO } from '../utils/formatters';

const yesNo = (value) => (value ? 'Sí' : 'No');

// Ficha de la impresora: general, ubicación y características, red, compra/garantía y estado.
const sections = (p) => [
  {
    title: 'Información general',
    items: [
      { label: 'Código', value: p.codigo_inventario },
      { label: 'Tipo', value: p.tipo },
      { label: 'Marca', value: p.marca },
      { label: 'Modelo', value: p.modelo },
      { label: 'Número de serie', value: p.numero_serie || <span className="text-slate-400">Sin número de serie</span>, wide: true },
    ],
  },
  {
    title: 'Ubicación y características',
    items: [
      { label: 'Ubicación', value: p.ubicacion || <span className="text-slate-400">Sin ubicación</span>, wide: true },
      { label: 'Tipo de conexión', value: TIPOS_CONEXION[p.tipo_conexion] },
      { label: 'Contador de impresiones', value: p.contador_impresiones != null && p.contador_impresiones.toLocaleString('es-MX') },
      { label: 'Imprime a color', value: yesNo(p.imprime_color) },
      { label: 'Doble cara (dúplex)', value: yesNo(p.duplex) },
    ],
  },
  {
    title: 'Red',
    items: [
      { label: 'Dirección IP', value: p.ip },
      { label: 'Dirección MAC', value: p.mac_address },
      { label: 'Hostname', value: p.hostname },
    ],
  },
  {
    title: 'Compra y garantía',
    items: [
      { label: 'Fecha de compra', value: p.fecha_compra && formatDate(p.fecha_compra) },
      {
        label: 'Garantía vigente hasta',
        value: p.garantia_vence && `${formatDate(p.garantia_vence)}${p.garantia_vence < todayISO() ? ' (vencida)' : ''}`,
      },
      { label: 'Detalle de garantía', value: p.garantia_detalle, wide: true },
    ],
  },
  {
    title: 'Estado',
    items: [
      { label: 'Estado de la impresora', value: <EstadoInventarioBadge estado={p.estado} /> },
      p.fecha_baja && { label: 'Fecha de baja', value: formatDate(p.fecha_baja) },
      { label: 'Observaciones', value: p.observaciones && <span className="whitespace-pre-line">{p.observaciones}</span>, wide: true },
    ].filter(Boolean),
  },
];

export default function ImpresoraDetalle() {
  return <InventarioDetalle kind="impresoras" sections={sections} />;
}
