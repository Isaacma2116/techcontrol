import { useState } from 'react';
import { Eye, KeyRound } from 'lucide-react';
import Button from '../ui/Button.jsx';
import MostrarPasswordEquipoModal from './MostrarPasswordEquipoModal.jsx';
import { useCan } from '../../hooks/useCan';

/**
 * Celda "Contraseña" de la ficha de un equipo. Autocontenido (guarda su propio
 * estado del modal) para poder usarse como `value` dentro de InfoItem/sections()
 * sin tocar el componente generico InventarioDetalle.
 */
export default function EquipoPasswordField({ equipo }) {
  const can = useCan();
  const [mostrar, setMostrar] = useState(false);

  if (!equipo.tiene_password) return <span className="text-slate-400">Sin contraseña registrada</span>;

  return (
    <>
      {can('equipos.ver_contrasenas') ? (
        <Button variant="secondary" icon={Eye} onClick={() => setMostrar(true)}>Mostrar contraseña</Button>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-slate-500">
          <KeyRound size={14} /> •••••••• (solo un administrador puede verla)
        </span>
      )}
      {mostrar && <MostrarPasswordEquipoModal equipo={equipo} onClose={() => setMostrar(false)} />}
    </>
  );
}
