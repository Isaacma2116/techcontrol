import { useState } from 'react';
import { Repeat } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Field, Textarea } from '../ui/FormField.jsx';
import DestinoFields from './DestinoFields.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { licenciaService } from '../../services/licenciaService';

const origenTexto = (a) => a.colaborador?.nombre_completo || a.equipo?.codigo_inventario || 'el destino actual';

/** Mueve un puesto ya asignado a otro colaborador/equipo (libera el actual y asigna el nuevo). */
export default function TransferirModal({ licencia, asignacion, onClose, onDone }) {
  const toast = useToast();
  const [colaborador, setColaborador] = useState(null);
  const [equipo, setEquipo] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const ambito = licencia.modelo.ambito;

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setFormError('');
    const e = {};
    if (ambito === 'usuario' && !colaborador) e.colaborador_id = 'Selecciona el nuevo colaborador.';
    if (ambito === 'dispositivo' && !equipo) e.equipo_id = 'Selecciona el nuevo equipo.';
    if (ambito === 'ambos' && !colaborador && !equipo) e.colaborador_id = 'Selecciona un colaborador, un equipo, o ambos.';
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      const res = await licenciaService.transferir(licencia.id, asignacion.id, {
        colaborador_id: colaborador?.id || null,
        equipo_id: equipo?.id || null,
        observaciones: observaciones.trim() || null,
      });
      toast.success(res.message);
      onDone(res.data.asignacion);
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
      title={`Transferir puesto de ${licencia.codigo}`}
      subtitle={`Actualmente en ${origenTexto(asignacion)}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="form-transferir-licencia" icon={Repeat} loading={saving}>Transferir</Button>
        </>
      }
    >
      <form id="form-transferir-licencia" onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{formError}</div>}

        <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
          Se liberará el puesto actual y se creará una asignación nueva. El historial conserva ambos movimientos.
        </p>

        <DestinoFields ambito={ambito} colaborador={colaborador} equipo={equipo} onColaborador={setColaborador} onEquipo={setEquipo} errors={errors} />

        <Field label="Observaciones" htmlFor="tr-observaciones" error={errors.observaciones} hint="Opcional">
          <Textarea id="tr-observaciones" rows={2} maxLength={1000} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}
