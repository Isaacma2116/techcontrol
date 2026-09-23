import { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Field, Input, Textarea } from '../ui/FormField.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { mantenimientoService } from '../../services/mantenimientoService';
import { formatDate } from '../../utils/formatters';

/** Mueve el mantenimiento a otra fecha; la cita anterior queda registrada. */
export default function ReprogramarModal({ mantenimiento, onClose, onDone }) {
  const toast = useToast();
  const [values, setValues] = useState({ fecha_programada: '', hora_programada: mantenimiento.hora_programada?.slice(0, 5) || '', motivo: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setFormError('');
    if (!values.fecha_programada) return setErrors({ fecha_programada: 'Elige la fecha nueva.' });
    if (values.fecha_programada === mantenimiento.fecha_programada) {
      return setErrors({ fecha_programada: 'La fecha nueva debe ser distinta de la actual.' });
    }

    setSaving(true);
    try {
      const res = await mantenimientoService.reprogramar(mantenimiento.id, {
        ...values,
        hora_programada: values.hora_programada || null,
      });
      toast.success(res.message);
      onDone(res.data.mantenimiento);
    } catch (err) {
      setErrors(err.errors || {});
      setFormError(err.errors ? '' : err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Reprogramar ${mantenimiento.folio}`}
      subtitle={`${mantenimiento.recurso.codigo_inventario} · programado para el ${formatDate(mantenimiento.fecha_programada)}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="form-reprogramar" icon={CalendarClock} loading={saving}>Reprogramar</Button>
        </>
      }
    >
      <form id="form-reprogramar" onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{formError}</div>
        )}

        <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
          Se creará una cita nueva para la fecha que elijas. La actual queda como <strong>reprogramada</strong>,
          con su fecha original, para que el historial no se pierda.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Fecha nueva" htmlFor="rp-fecha" required error={errors.fecha_programada}>
            <Input id="rp-fecha" type="date" value={values.fecha_programada} error={errors.fecha_programada} onChange={(e) => set('fecha_programada', e.target.value)} />
          </Field>
          <Field label="Hora" htmlFor="rp-hora" error={errors.hora_programada} hint="Opcional">
            <Input id="rp-hora" type="time" value={values.hora_programada} error={errors.hora_programada} onChange={(e) => set('hora_programada', e.target.value)} />
          </Field>
        </div>

        <Field label="¿Por qué se mueve?" htmlFor="rp-motivo" error={errors.motivo} hint="Queda en el historial. Opcional.">
          <Textarea id="rp-motivo" rows={3} maxLength={255} value={values.motivo} error={errors.motivo} onChange={(e) => set('motivo', e.target.value)} placeholder="Ej. El colaborador está de viaje." />
        </Field>
      </form>
    </Modal>
  );
}
