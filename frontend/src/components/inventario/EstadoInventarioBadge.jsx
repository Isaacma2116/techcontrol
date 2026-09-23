import Badge from '../ui/Badge.jsx';
import { ESTADOS } from '../../utils/inventarioConfig';

/** Estado de un equipo/accesorio (Disponible, Asignado, Mantenimiento...). */
export default function EstadoInventarioBadge({ estado }) {
  const cfg = ESTADOS[estado] || { label: estado, tone: 'slate' };
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}
