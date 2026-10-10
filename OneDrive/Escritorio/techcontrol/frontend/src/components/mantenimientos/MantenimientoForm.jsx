import { useState } from 'react';
import { CalendarPlus, Save } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { Field, Input, Select, Textarea } from '../ui/FormField.jsx';
import UnidadPicker from './UnidadPicker.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { mantenimientoService } from '../../services/mantenimientoService';
import { PRIORIDADES, TIPOS, UNIDADES } from '../../utils/mantenimientosConfig';
import { todayISO } from '../../utils/formatters';

/**
 * Agendar o editar un mantenimiento.
 *  - `mantenimiento`: al editar (solo programados o en proceso).
 *  - `fecha` / `unidad`: valores iniciales (agendar desde un día del calendario
 *    o desde la ficha de una unidad).
 */
export default function MantenimientoForm({ mantenimiento, fecha, unidad, onClose, onSaved }) {
  const toast = useToast();
  const editar = !!mantenimiento;

  const inicial = {
    tipo: mantenimiento?.tipo || 'preventivo',
    tipo_recurso: mantenimiento?.tipo_recurso || unidad?.tipo_recurso || 'EQUIPO',
    fecha_programada: mantenimiento?.fecha_programada || fecha || todayISO(),
    hora_programada: mantenimiento?.hora_programada?.slice(0, 5) || '',
    prioridad: mantenimiento?.prioridad || 'media',
    motivo: mantenimiento?.motivo || '',
    observaciones: mantenimiento?.observaciones || '',
  };

  const [values, setValues] = useState(inicial);
  const [item, setItem] = useState(
    mantenimiento
      ? { id: mantenimiento.recurso.id, codigo_inventario: mantenimiento.recurso.codigo_inventario, titulo: mantenimiento.recurso.titulo, tipo: mantenimiento.recurso.tipo }
      : unidad || null
  );
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const unidadFija = !!unidad && !editar; // se agenda desde la ficha de la unidad
  const dirty =
    JSON.stringify(values) !== JSON.stringify(inicial) || (!editar && !!item && !unidadFija);

  const set = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };
  const bind = (name) => ({ id: `m-${name}`, value: values[name], error: errors[name], onChange: (e) => set(name, e.target.value) });

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setFormError('');
    const e = {};
    if (!item) e.recurso_id = 'Selecciona la unidad a la que se le hará el mantenimiento.';
    if (!values.fecha_programada) e.fecha_programada = 'La fecha programada es obligatoria.';
    setErrors(e);
    if (Object.keys(e).length) return;

    const payload = { ...values, recurso_id: item.id, hora_programada: values.hora_programada || null };

    setSaving(true);
    try {
      const res = editar
        ? await mantenimientoService.update(mantenimiento.id, payload)
        : await mantenimientoService.create(payload);
      toast.success(res.message);
      onSaved(res.data.mantenimiento);
    } catch (err) {
      setErrors(err.errors || {});
      setFormError(err.errors ? '' : err.message);
    } finally {
      setSaving(false);
    }
  };

  const tryClose = () => (dirty ? setConfirmClose(true) : onClose());

  return (
    <>
      <Modal
        open
        onClose={tryClose}
        title={editar ? `Editar mantenimiento ${mantenimiento.folio}` : 'Agendar mantenimiento'}
        subtitle={editar ? 'Solo se puede editar mientras no se haya realizado.' : 'Elige la unidad, el tipo y el día en que se hará.'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={tryClose}>Cancelar</Button>
            <Button type="submit" form="form-mantenimiento" icon={editar ? Save : CalendarPlus} loading={saving}>
              {editar ? 'Guardar cambios' : 'Agendar'}
            </Button>
          </>
        }
      >
        <form id="form-mantenimiento" onSubmit={handleSubmit} noValidate className="space-y-5">
          {formError && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{formError}</div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Tipo de unidad" htmlFor="m-tipo_recurso" required error={errors.tipo_recurso}>
              <Select
                {...bind('tipo_recurso')}
                disabled={unidadFija}
                onChange={(e) => { set('tipo_recurso', e.target.value); setItem(null); }}
              >
                {Object.entries(UNIDADES).map(([valor, cfg]) => (
                  <option key={valor} value={valor}>{cfg.label}</option>
                ))}
              </Select>
            </Field>

            <Field label="Tipo de mantenimiento" htmlFor="m-tipo" required error={errors.tipo} hint={TIPOS[values.tipo]?.descripcion}>
              <Select {...bind('tipo')}>
                {Object.entries(TIPOS).map(([valor, cfg]) => (
                  <option key={valor} value={valor}>{cfg.label}</option>
                ))}
              </Select>
            </Field>

            <Field label="Unidad" htmlFor="m-recurso_id" required error={errors.recurso_id} className="sm:col-span-2">
              {unidadFija ? (
                <Input id="m-recurso_id" value={`${item.codigo_inventario} — ${item.titulo || item.tipo}`} readOnly className="bg-slate-50" />
              ) : (
                <UnidadPicker id="m-recurso_id" tipoRecurso={values.tipo_recurso} value={item} onChange={setItem} error={errors.recurso_id} />
              )}
            </Field>

            <Field label="Fecha programada" htmlFor="m-fecha_programada" required error={errors.fecha_programada}>
              <Input {...bind('fecha_programada')} type="date" />
            </Field>

            <Field label="Hora" htmlFor="m-hora_programada" error={errors.hora_programada} hint="Opcional">
              <Input {...bind('hora_programada')} type="time" />
            </Field>

            <Field label="Prioridad" htmlFor="m-prioridad" error={errors.prioridad}>
              <Select {...bind('prioridad')}>
                {Object.entries(PRIORIDADES).map(([valor, cfg]) => (
                  <option key={valor} value={valor}>{cfg.label}</option>
                ))}
              </Select>
            </Field>

            <Field
              label="Qué se va a hacer"
              htmlFor="m-motivo"
              error={errors.motivo}
              className="sm:col-span-2"
              hint="Lo planeado. Al cerrarlo se registra aparte lo que realmente se hizo."
            >
              <Textarea {...bind('motivo')} rows={3} maxLength={2000} placeholder="Ej. Limpieza interna, revisión de ventiladores y actualización del sistema." />
            </Field>

            <Field label="Notas internas" htmlFor="m-observaciones" error={errors.observaciones} className="sm:col-span-2" hint="Opcional">
              <Textarea {...bind('observaciones')} rows={2} maxLength={2000} />
            </Field>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmClose}
        title="¿Descartar los cambios?"
        message="Si cierras ahora, lo que capturaste no se guardará."
        confirmLabel="Descartar"
        cancelLabel="Seguir editando"
        variant="danger"
        onConfirm={onClose}
        onCancel={() => setConfirmClose(false)}
      />
    </>
  );
}
