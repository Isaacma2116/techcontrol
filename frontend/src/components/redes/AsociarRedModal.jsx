import { useEffect, useState } from 'react';
import { Link2 } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Field, Select } from '../ui/FormField.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { redService } from '../../services/redService';
import { dispositivoRedService } from '../../services/dispositivoRedService';
import { TIPOS_RED } from '../../utils/redesConfig';

/** Asocia el dispositivo a una red existente (relación M:N, base de la topología). */
export default function AsociarRedModal({ dispositivo, redesActuales, onClose, onDone }) {
  const toast = useToast();
  const [redes, setRedes] = useState(null);
  const [redId, setRedId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    redService.listAll().then((res) => setRedes(res.data.redes)).catch(() => setRedes([]));
  }, []);

  const yaAsociadas = new Set(redesActuales.map((r) => r.id));
  const disponibles = redes?.filter((r) => !yaAsociadas.has(r.id)) || [];

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!redId) return setError('Selecciona una red.');
    setSaving(true);
    setError('');
    try {
      const res = await dispositivoRedService.asociarRed(dispositivo.id, redId);
      toast.success(res.message);
      onDone(res.data.redes);
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
      title={`Asociar red a ${dispositivo.nombre}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="form-asociar-red" icon={Link2} loading={saving} disabled={!redes || disponibles.length === 0}>Asociar</Button>
        </>
      }
    >
      <form id="form-asociar-red" onSubmit={handleSubmit} noValidate className="space-y-4">
        {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>}
        <Field label="Red" htmlFor="asoc-red" required error={undefined}>
          <Select id="asoc-red" value={redId} onChange={(e) => setRedId(e.target.value)} disabled={!redes}>
            <option value="">Selecciona…</option>
            {disponibles.map((r) => <option key={r.id} value={r.id}>{r.nombre} ({TIPOS_RED[r.tipo]?.label})</option>)}
          </Select>
        </Field>
        {redes && disponibles.length === 0 && (
          <p className="text-xs text-slate-500">Ya está asociado a todas las redes activas disponibles.</p>
        )}
      </form>
    </Modal>
  );
}
