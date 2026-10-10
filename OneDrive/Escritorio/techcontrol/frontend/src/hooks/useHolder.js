import { useMemo, useState } from 'react';

/**
 * "Colaborador actual" de un formulario de inventario. El elemento no guarda a su
 * responsable: al cambiarlo, el backend cierra la asignacion vigente y crea otra.
 *  - item: detalle del elemento al editar (null al crear).
 * Un elemento en mantenimiento/reparacion/baja/perdido no se puede asignar.
 */
export function useHolder(item) {
  const initialHolder = useMemo(
    () =>
      item?.asignacion_actual
        ? {
            id: item.asignacion_actual.colaborador_id,
            nombre_completo: item.asignacion_actual.nombre_completo,
            id_empleado: item.asignacion_actual.id_empleado,
          }
        : null,
    [item]
  );
  const [holder, setHolder] = useState(initialHolder);

  return {
    holder,
    setHolder,
    initialHolder,
    holderChanged: (holder?.id ?? null) !== (initialHolder?.id ?? null),
    canChangeHolder: !item || item.estado === 'disponible' || item.estado === 'asignado',
  };
}
