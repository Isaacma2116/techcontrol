import { useState } from 'react';
import { UserMinus } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Field, Textarea } from '../ui/FormField.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { licenciaService } from '../../services/licenciaService';

const destinoTexto = (a) => a.colaborador?.nombre_completo || a.equipo?.codigo_inventario || 'este destino';

/** Libera un puesto (no se borra: queda el historial y se puede reasignar después). */
export default function LiberarModal({ licencia, asignacion, onClose, onDone }) {
  const toast = useToast();
  const [observaciones, setObservaciones] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await licenciaService.liberar(licencia.id, asignacion.id, observaciones.trim() || undefined);
      toast.success(res.message);
      onDone(res.data.asignacion);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Liberar puesto de ${licencia.codigo}`}
      subtitle={`Actualmente con ${destinoTexto(asignacion)}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="form-liberar-licencia" icon={UserMinus} loading={saving}>Liberar puesto</Button>
        </>
      }
    >
      <form id="form-liberar-licencia" onSubmit={handleSubmit} noValidate className="space-y-4">
        {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>}
        <p className="text-sm text-slate-600">
          El puesto quedará disponible para asignarse a alguien más. La asignación anterior no se borra: queda en el historial.
        </p>
        <Field label="Observaciones" htmlFor="lib-observaciones" hint="Opcional">
          <Textarea id="lib-observaciones" rows={2} maxLength={1000} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}
