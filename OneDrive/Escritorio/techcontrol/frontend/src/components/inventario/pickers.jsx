import { useCallback } from 'react';
import AsyncPicker from '../ui/AsyncPicker.jsx';
import { colaboradorService } from '../../services/colaboradorService';
import { inventarioServices } from '../../services/inventarioService';
import { KINDS } from '../../utils/inventarioConfig';

export const colaboradorLabel = (c) => `${c.nombre_completo} (${c.id_empleado})`;

/** Buscador de colaboradores (por defecto solo activos: a un inactivo no se le asigna nada). */
export function ColaboradorPicker({ onlyActive = true, placeholder = 'Buscar por nombre o ID de empleado…', ...props }) {
  const fetcher = useCallback(
    (q) =>
      colaboradorService
        .list({ search: q, activo: onlyActive ? 'true' : '', limit: 8 })
        .then((res) => res.data.colaboradores),
    [onlyActive]
  );

  return (
    <AsyncPicker
      {...props}
      fetcher={fetcher}
      placeholder={placeholder}
      emptyLabel="No se encontraron colaboradores."
      getLabel={colaboradorLabel}
      renderOption={(c) => (
        <div>
          <p className="font-medium text-slate-800">{c.nombre_completo}</p>
          <p className="text-xs text-slate-500">{c.id_empleado} · {c.area} · {c.cargo}</p>
        </div>
      )}
    />
  );
}

export const itemLabel = (i) => `${i.codigo_inventario} — ${i.titulo || i.tipo}`;

/** Buscador de equipos/accesorios DISPONIBLES (los unicos que se pueden asignar). */
export function DisponiblePicker({ kind, ...props }) {
  const fetcher = useCallback(
    (q) =>
      inventarioServices[kind]
        .list({ search: q, estado: 'disponible', limit: 8 })
        .then((res) => res.data.items),
    [kind]
  );

  return (
    <AsyncPicker
      {...props}
      fetcher={fetcher}
      placeholder={`Buscar ${KINDS[kind].singular} por código, serie o modelo…`}
      emptyLabel={`No hay ${KINDS[kind].plural} disponibles que coincidan.`}
      getLabel={itemLabel}
      renderOption={(i) => (
        <div>
          <p className="font-medium text-slate-800">
            {i.codigo_inventario} <span className="font-normal text-slate-600">— {i.titulo || i.tipo}</span>
          </p>
          <p className="text-xs text-slate-500">
            {i.tipo} · {i.numero_serie ? `Serie: ${i.numero_serie}` : 'Sin número de serie'}
          </p>
        </div>
      )}
    />
  );
}
