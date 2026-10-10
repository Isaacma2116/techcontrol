import Badge from '../ui/Badge.jsx';
import { ESTADOS_CARTA } from '../../utils/cartasConfig';

/** Estado de una carta responsiva (Borrador, Generada, Pendiente de firma, Firmada, Cancelada). */
export default function CartaEstadoBadge({ estado }) {
  const cfg = ESTADOS_CARTA[estado] || { label: estado, tone: 'slate' };
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}
