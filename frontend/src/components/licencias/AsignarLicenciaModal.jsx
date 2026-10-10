import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Field, Input, Textarea } from '../ui/FormField.jsx';
import DestinoFields from './DestinoFields.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { licenciaService } from '../../services/licenciaService';

/** Asigna un puesto libre de la licencia a un colaborador y/o un equipo. */
export default function AsignarLicenciaModal({ licencia, onClose, onDone }) {
  const toast = useToast();
  const [colaborador, setColaborador] = useState(null);
  const [equipo, setEquipo] = useState(null);
  const [identificador, setIdentificador] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const ambito = licencia.modelo.ambito;

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setFormError('');
    const e = {};
    if (ambito === 'usuario' && !colaborador) e.colaborador_id = 'Selecciona el colaborador.';
    if (ambito === 'dispositivo' && !equipo) e.equipo_id = 'Selecciona el equipo.';
    if (ambito === 'ambos' && !colaborador && !equipo) e.colaborador_id = 'Selecciona un colaborador, un equipo, o ambos.';
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      const res = await licenciaService.asignar(licencia.id, {
        colaborador_id: colaborador?.id || null,
        equipo_id: equipo?.id || null,
        identificador_activacion: identificador.trim() || null,
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
      title={`Asignar puesto de ${licencia.codigo}`}
      subtitle={`${licencia.disponibles} de ${licencia.cantidad_total} puestos disponibles`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="form-asignar-licencia" icon={UserPlus} loading={saving}>Asignar</Button>
        </>
      }
    >
      <form id="form-asignar-licencia" onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{formError}</div>}

        <DestinoFields ambito={ambito} colaborador={colaborador} equipo={equipo} onColaborador={setColaborador} onEquipo={setEquipo} errors={errors} />

        <Field label="Identificador de activación" htmlFor="asig-identificador" error={errors.identificador_activacion} hint="Opcional. Útil en licencias por activación: correo o equipo donde quedó activada.">
          <Input id="asig-identificador" value={identificador} onChange={(e) => setIdentificador(e.target.value)} maxLength={150} />
        </Field>

        <Field label="Observaciones" htmlFor="asig-observaciones" error={errors.observaciones} hint="Opcional">
          <Textarea id="asig-observaciones" rows={2} maxLength={1000} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}
