import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Field, Textarea } from '../ui/FormField.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { cartaService } from '../../services/cartaService';

/**
 * Cancela una carta. Nunca se borra: queda en el historial. Los recursos se liberan
 * para poder incluirlos en una carta nueva. Una carta firmada exige motivo.
 */
export default function CancelarCartaModal({ carta, onClose, onDone }) {
  const toast = useToast();
  const requiereMotivo = carta.estado === 'firmada';
  const [motivo, setMotivo] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (requiereMotivo && !motivo.trim()) return setErrors({ motivo: 'Indica el motivo de la cancelación.' });

    setSaving(true);
    try {
      const res = await cartaService.cancelar(carta.id, motivo.trim());
      toast.success('Carta cancelada.');
      onDone(res.data.carta);
    } catch (err) {
      setErrors(err.errors || {});
      setFormError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={saving ? undefined : onClose}
      size="sm"
      title="Cancelar carta"
      subtitle={carta.folio}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Volver</Button>
          <Button type="submit" form="cancelar-form" variant="danger" loading={saving}>Cancelar carta</Button>
        </>
      }
    >
      <form id="cancelar-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{formError}</span>
          </div>
        )}
        <p className="text-sm text-slate-600">
          La carta no se elimina: queda en el historial con el estado <strong>Cancelada</strong>.
          {requiereMotivo && ' Es una carta firmada, por lo que el motivo es obligatorio.'}
        </p>
        <Field label="Motivo" htmlFor="cancelar-motivo" required={requiereMotivo} error={errors.motivo}>
          <Textarea id="cancelar-motivo" value={motivo} maxLength={500} error={errors.motivo} onChange={(e) => setMotivo(e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}
