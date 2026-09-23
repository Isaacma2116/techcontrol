import { useEffect, useState } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import Button from '../ui/Button.jsx';
import ConexionesTable from './ConexionesTable.jsx';
import { dispositivoRedService } from '../../services/dispositivoRedService';

/**
 * Todas las relaciones dispositivo<->red, en una sola tabla. Es la base logica
 * para la futura vista de topologia (sin editor grafico todavia).
 */
export default function ConexionesTab() {
  const [conexiones, setConexiones] = useState(null);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError('');
    dispositivoRedService.conexiones()
      .then((res) => !cancelled && setConexiones(res.data.conexiones))
      .catch((err) => !cancelled && setError(err.message));
    return () => { cancelled = true; };
  }, [reloadKey]);

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">
        Qué dispositivo está conectado a qué red. Es la base para, más adelante, mostrar esto como un diagrama.
      </p>
      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center">
          <AlertCircle size={28} className="text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
          <Button variant="secondary" icon={RotateCcw} onClick={() => setReloadKey((k) => k + 1)}>Reintentar</Button>
        </div>
      ) : !conexiones ? (
        <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white" />
      ) : (
        <ConexionesTable conexiones={conexiones} />
      )}
    </div>
  );
}
