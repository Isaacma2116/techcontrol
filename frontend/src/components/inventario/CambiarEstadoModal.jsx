import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Field, Select, Textarea } from '../ui/FormField.jsx';
import EstadoInventarioBadge from './EstadoInventarioBadge.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { inventarioServices } from '../../services/inventarioService';
import { ESTADOS, ESTADOS_MANUALES, KINDS } from '../../utils/inventarioConfig';

/**
 * Cambio manual de estado (mantenimiento, reparacion, baja, perdido, disponible).
 * No aplica a un item ASIGNADO: primero se devuelve (asi queda el historial).
 */
export default function CambiarEstadoModal({ kind, item, onClose, onDone }) {
  const cfg = KINDS[kind];
  const toast = useToast();
  const options = ESTADOS_MANUALES.filter((e) => e !== item.estado);

  const [estado, setEstado] = useState(options[0]);
  const [observaciones, setObservaciones] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const res = await inventarioServices[kind].setEstado(item.id, estado, observaciones);
      toast.success(`Estado actualizado a ${ESTADOS[estado].label}.`);
      onDone(res.data.item);
    } catch (err) {
      setFormError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={saving ? undefined : onClose}
      size="sm"
      title="Cambiar estado"
      subtitle={`${item.codigo_inventario} · ${item.titulo || item.tipo}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form="estado-form" loading={saving}>Guardar estado</Button>
        </>
      }
    >
      <form id="estado-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-slate-500">
          Estado actual: <EstadoInventarioBadge estado={item.estado} />
        </div>

        <Field label={`Nuevo estado ${cfg.del} ${cfg.singular}`} htmlFor="estado-nuevo" required>
          <Select id="estado-nuevo" value={estado} onChange={(e) => setEstado(e.target.value)}>
            {options.map((value) => (
              <option key={value} value={value}>{ESTADOS[value].label}</option>
            ))}
          </Select>
        </Field>

        <Field label="Motivo u observaciones" htmlFor="estado-obs" hint="Se agrega a las observaciones con la fecha de hoy.">
          <Textarea id="estado-obs" value={observaciones} maxLength={500} onChange={(e) => setObservaciones(e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}
