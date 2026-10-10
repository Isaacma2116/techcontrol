import { useSearchParams } from 'react-router-dom';
import { Network, Router, Share2 } from 'lucide-react';
import RedesTab from '../components/redes/RedesTab.jsx';
import DispositivosTab from '../components/redes/DispositivosTab.jsx';
import ConexionesTab from '../components/redes/ConexionesTab.jsx';

const TABS = [
  { id: 'redes', label: 'Redes', icon: Network },
  { id: 'dispositivos', label: 'Dispositivos', icon: Router },
  { id: 'conexiones', label: 'Conexiones', icon: Share2 },
];

/**
 * Redes y Dispositivos de Red: tres pestañas que comparten la pantalla
 * (Redes | Dispositivos | Conexiones), igual que pide el módulo. Cada pestaña
 * guarda sus propios filtros en la URL (?tab=... se preserva aparte).
 */
export default function Redes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === searchParams.get('tab')) ? searchParams.get('tab') : 'redes';

  const cambiarTab = (id) => {
    // Cambiar de pestaña limpia los filtros de la anterior (cada una tiene los suyos).
    setSearchParams({ tab: id });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Redes y dispositivos de red</h2>
        <p className="text-sm text-slate-500">Infraestructura de red: Wi-Fi, LAN, VLANs y los equipos que las forman.</p>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1 sm:w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => cambiarTab(id)}
            aria-pressed={tab === id}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors
              ${tab === id ? 'bg-white text-brand-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {tab === 'redes' && <RedesTab />}
      {tab === 'dispositivos' && <DispositivosTab />}
      {tab === 'conexiones' && <ConexionesTab />}
    </div>
  );
}
