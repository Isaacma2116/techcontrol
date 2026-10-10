import { Field } from '../ui/FormField.jsx';
import { ColaboradorPicker } from '../inventario/pickers.jsx';
import UnidadPicker from '../mantenimientos/UnidadPicker.jsx';

/**
 * Colaborador y/o equipo destino de un puesto de licencia, segun el ambito
 * del modelo (usuario | dispositivo | ambos).
 */
export default function DestinoFields({ ambito, colaborador, equipo, onColaborador, onEquipo, errors }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {ambito !== 'dispositivo' && (
        <Field label="Colaborador" htmlFor="dest-colaborador" required={ambito === 'usuario'} error={errors.colaborador_id} className={ambito === 'usuario' ? 'sm:col-span-2' : undefined}>
          <ColaboradorPicker id="dest-colaborador" value={colaborador} onChange={onColaborador} error={errors.colaborador_id} />
        </Field>
      )}
      {ambito !== 'usuario' && (
        <Field label="Equipo" htmlFor="dest-equipo" required={ambito === 'dispositivo'} error={errors.equipo_id} className={ambito === 'dispositivo' ? 'sm:col-span-2' : undefined}>
          <UnidadPicker id="dest-equipo" tipoRecurso="EQUIPO" value={equipo} onChange={onEquipo} error={errors.equipo_id} />
        </Field>
      )}
      {ambito === 'ambos' && !errors.colaborador_id && !errors.equipo_id && (
        <p className="text-xs text-slate-500 sm:col-span-2">Elige un colaborador, un equipo, o ambos.</p>
      )}
    </div>
  );
}
