import { useNavigate } from 'react-router-dom';
import { Boxes, Laptop, Monitor, Smartphone } from 'lucide-react';
import Button from '../ui/Button.jsx';

const ITEMS = [
  { key: 'laptops', label: 'Laptops', icon: Laptop },
  { key: 'desktops', label: 'Desktops', icon: Laptop },
  { key: 'monitores', label: 'Monitores', icon: Monitor },
  { key: 'celulares', label: 'Celulares', icon: Smartphone },
  { key: 'otros', label: 'Otros activos', icon: Boxes },
];

/** Que hay disponible AHORA MISMO para entregar (nada asignado a nadie). */
export default function EquiposDisponibles({ disponibles }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {ITEMS.map(({ key, label, icon: Icon }) => (
          <div key={key} className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-900/5 text-brand-500">
              <Icon size={16} />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight text-slate-800">{disponibles[key]}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end border-t border-slate-100 pt-3">
        <Button variant="secondary" onClick={() => navigate('/equipos?estado=disponible')}>Ver inventario disponible</Button>
      </div>
    </div>
  );
}
