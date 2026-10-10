import { useState } from 'react';
import { XCircle } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Field, Textarea } from '../ui/FormField.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { mantenimientoService } from '../../services/mantenimientoService';

/** Cancela un mantenimiento agendado (no se borra: queda el registro y el motivo). */
export default function CancelarModal({ mantenimiento, onClose, onDone }) {
  const toast = useToast();
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setFormError('');
    if (!motivo.trim()) return setError('Indica por qué se cancela.');

    setSaving(true);
    try {
      const res = await mantenimientoService.cancelar(mantenimiento.id, motivo.trim());
      toast.success(res.message);
      onDone(res.data.mantenimiento);
    } catch (err) {
      setError(err.errors?.motivo || '');
      setFormError(err.errors?.motivo ? '' : err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Cancelar ${mantenimiento.folio}`}
      subtitle={`${mantenimiento.recurso.codigo_inventario} · ${mantenimiento.recurso.titulo || mantenimiento.recurso.tipo}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Volver</Button>
          <Button type="submit" form="form-cancelar" variant="danger" icon={XCircle} loading={saving}>
            Cancelar mantenimiento
          </Button>
        </>
      }
    >
      <form id="form-cancelar" onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{formError}</div>
        )}
        <p className="text-sm text-slate-600">
          El mantenimiento no se borra: queda registrado como cancelado junto con el motivo.
          Si solo cambió la fecha, usa <strong>Reprogramar</strong>.
        </p>
        <Field label="Motivo de la cancelación" htmlFor="ca-motivo" required error={error}>
          <Textarea id="ca-motivo" rows={3} maxLength={255} value={motivo} error={error} onChange={(e) => { setMotivo(e.target.value); setError(''); }} placeholder="Ej. El equipo se dio de baja." />
        </Field>
      </form>
    </Modal>
  );
}
