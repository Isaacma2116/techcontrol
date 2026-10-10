import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Field, Input, Select, Textarea } from '../ui/FormField.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { asignacionService } from '../../services/inventarioService';
import { CONDICIONES, ESTADOS, ESTADOS_MANUALES, KINDS } from '../../utils/inventarioConfig';
import { todayISO } from '../../utils/formatters';

// Estado sugerido segun la condicion en que regresa (el usuario puede cambiarlo).
const ESTADO_SUGERIDO = { bueno: 'disponible', regular: 'disponible', danado: 'reparacion', perdido: 'perdido' };

/**
 * Registra la devolucion de un equipo/accesorio/impresora/celular: cierra la asignacion vigente
 * (queda en el historial) y deja el item en el estado elegido.
 *  - asignacionId: id de la ASIGNACION vigente (no del equipo).
 */
export default function DevolverModal({ kind, asignacionId, itemLabel, colaboradorLabel, onClose, onDone }) {
  const cfg = KINDS[kind];
  const toast = useToast();

  const [fecha, setFecha] = useState(todayISO());
  const [condicion, setCondicion] = useState('bueno');
  const [nuevoEstado, setNuevoEstado] = useState('disponible');
  const [observaciones, setObservaciones] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const changeCondicion = (value) => {
    setCondicion(value);
    setNuevoEstado(ESTADO_SUGERIDO[value]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!fecha) return setErrors({ fecha_devolucion: 'Indica la fecha de devolución.' });
    setErrors({});

    setSaving(true);
    try {
      const res = await asignacionService.devolver(kind, asignacionId, {
        fecha_devolucion: fecha,
        condicion,
        nuevo_estado: nuevoEstado,
        observaciones,
      });
      toast.success(`${cfg.Singular} devuelt${cfg.o} correctamente.`);
      onDone(res.data.item);
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
      size="md"
      title={`Devolver ${cfg.singular}`}
      subtitle={[itemLabel, colaboradorLabel && `de ${colaboradorLabel}`].filter(Boolean).join(' · ')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form="devolver-form" loading={saving}>Registrar devolución</Button>
        </>
      }
    >
      <form id="devolver-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Fecha de devolución" htmlFor="dev-fecha" required error={errors.fecha_devolucion}>
            <Input id="dev-fecha" type="date" max={todayISO()} value={fecha} error={errors.fecha_devolucion} onChange={(e) => setFecha(e.target.value)} />
          </Field>
          <Field label="Condición al devolver" htmlFor="dev-condicion" required error={errors.condicion}>
            <Select id="dev-condicion" value={condicion} error={errors.condicion} onChange={(e) => changeCondicion(e.target.value)}>
              {Object.entries(CONDICIONES).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </Field>
        </div>

        <Field
          label={`Estado ${cfg.del} ${cfg.singular} después de la devolución`}
          htmlFor="dev-estado"
          error={errors.nuevo_estado}
          hint={condicion === 'perdido' ? 'Un elemento extraviado queda como Perdido.' : 'Disponible lo deja listo para asignarse a otra persona.'}
        >
          <Select
            id="dev-estado"
            value={nuevoEstado}
            error={errors.nuevo_estado}
            disabled={condicion === 'perdido'}
            onChange={(e) => setNuevoEstado(e.target.value)}
          >
            {ESTADOS_MANUALES.map((value) => (
              <option key={value} value={value}>{ESTADOS[value].label}</option>
            ))}
          </Select>
        </Field>

        <Field label="Observaciones sobre su estado" htmlFor="dev-obs" error={errors.observaciones}>
          <Textarea
            id="dev-obs"
            value={observaciones}
            maxLength={1000}
            error={errors.observaciones}
            placeholder="Daños, faltantes, accesorios devueltos…"
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </Field>
      </form>
    </Modal>
  );
}
