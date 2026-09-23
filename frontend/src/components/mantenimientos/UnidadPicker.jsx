import { useCallback } from 'react';
import AsyncPicker from '../ui/AsyncPicker.jsx';
import { inventarioServices } from '../../services/inventarioService';
import { UNIDADES } from '../../utils/mantenimientosConfig';

export const unidadLabel = (i) => `${i.codigo_inventario} — ${i.titulo || i.tipo}`;

/**
 * Buscador de unidades del inventario para agendar mantenimiento.
 * A diferencia del selector de asignaciones, aqui SI aparecen las unidades
 * asignadas (a un equipo en uso tambien se le da mantenimiento); solo se
 * excluyen las dadas de baja.
 */
export default function UnidadPicker({ tipoRecurso, ...props }) {
  const kind = UNIDADES[tipoRecurso]?.kind || 'equipos';

  const fetcher = useCallback(
    (q) =>
      inventarioServices[kind]
        .list({ search: q, limit: 12 })
        .then((res) => res.data.items.filter((i) => i.estado !== 'baja').slice(0, 8)),
    [kind]
  );

  return (
    <AsyncPicker
      {...props}
      fetcher={fetcher}
      placeholder={`Buscar ${UNIDADES[tipoRecurso]?.label.toLowerCase() || 'unidad'} por código, serie o modelo…`}
      emptyLabel="No se encontraron unidades."
      getLabel={unidadLabel}
      renderOption={(i) => (
        <div>
          <p className="font-medium text-slate-800">
            {i.codigo_inventario} <span className="font-normal text-slate-600">— {i.titulo || i.tipo}</span>
          </p>
          <p className="text-xs text-slate-500">
            {i.tipo}
            {i.colaborador_nombre ? ` · con ${i.colaborador_nombre}` : ''}
            {i.numero_serie ? ` · Serie: ${i.numero_serie}` : ''}
          </p>
        </div>
      )}
    />
  );
}
