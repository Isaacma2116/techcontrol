import { useCallback } from 'react';
import AsyncPicker from '../ui/AsyncPicker.jsx';
import { softwareService } from '../../services/softwareService';

export const softwareLabel = (s) => (s.fabricante ? `${s.nombre} (${s.fabricante.nombre})` : s.nombre);

/** Buscador de software (para elegir a que programa pertenece una licencia). */
export default function SoftwarePicker(props) {
  const fetcher = useCallback((q) => softwareService.list({ search: q, limit: 8 }).then((res) => res.data.software), []);
  return (
    <AsyncPicker
      {...props}
      fetcher={fetcher}
      placeholder="Buscar software por nombre o fabricante…"
      emptyLabel="No se encontró software con ese nombre."
      getLabel={softwareLabel}
      renderOption={(s) => (
        <div>
          <p className="font-medium text-slate-800">{s.nombre}</p>
          <p className="text-xs text-slate-500">{s.fabricante?.nombre || 'Sin fabricante'} · {s.requiere_licencia ? 'Requiere licencia' : 'Sin licencia'}</p>
        </div>
      )}
    />
  );
}
