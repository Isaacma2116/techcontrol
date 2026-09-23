import FormSection from '../ui/FormSection.jsx';
import { Field, Input } from '../ui/FormField.jsx';
import { ColaboradorPicker } from './pickers.jsx';
import { KINDS } from '../../utils/inventarioConfig';
import { todayISO } from '../../utils/formatters';

/**
 * Seccion "Asignacion" de los formularios de inventario (impresoras y celulares).
 * `holder` viene de useHolder(); `bind` es el de useForm del formulario.
 */
export default function HolderSection({ kind, isEdit, holder, holderChanged, initialHolder, canChangeHolder, onHolderChange, errors, bind }) {
  const cfg = KINDS[kind];
  const Cap = `${cfg.el[0].toUpperCase()}${cfg.el.slice(1)}`;

  return (
    <FormSection
      title="Asignación"
      description={`${Cap} ${cfg.singular} no guarda a su responsable: se registra una asignación con su historial.`}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Colaborador actual"
          htmlFor="f-colaborador_id"
          error={errors.colaborador_id}
          className="sm:col-span-2"
          hint={
            !canChangeHolder
              ? `Solo se puede asignar ${cfg.el} ${cfg.singular} en estado Disponible. Cambia su estado primero.`
              : isEdit && holderChanged && initialHolder
                ? 'Se cerrará la asignación actual (sin evaluar su condición) y se creará una nueva. Para registrar daños usa "Devolver" en el detalle.'
                : `Déjalo vacío para que ${cfg.el} ${cfg.singular} quede sin asignar (Disponible).`
          }
        >
          <ColaboradorPicker
            id="f-colaborador_id"
            value={holder}
            onChange={onHolderChange}
            error={errors.colaborador_id}
            disabled={!canChangeHolder}
            placeholder="Sin asignar — busca un colaborador para asignarlo"
          />
        </Field>
        {holderChanged && holder && (
          <>
            <Field label="Fecha de asignación" htmlFor="f-fecha_asignacion" error={errors.fecha_asignacion}>
              <Input {...bind('fecha_asignacion')} type="date" max={todayISO()} />
            </Field>
            <Field label="Observaciones de la asignación" htmlFor="f-observaciones_asignacion">
              <Input {...bind('observaciones_asignacion')} maxLength={1000} />
            </Field>
          </>
        )}
      </div>
    </FormSection>
  );
}
