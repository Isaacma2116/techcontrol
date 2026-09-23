import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Field, Input } from '../ui/FormField.jsx';
import { ColaboradorPicker, DisponiblePicker } from './pickers.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { asignacionService } from '../../services/inventarioService';
import { KINDS } from '../../utils/inventarioConfig';
import { todayISO } from '../../utils/formatters';

/**
 * Asigna un equipo/accesorio/impresora/celular a un colaborador.
 *  - `item` y/o `colaborador` pueden venir fijos (segun desde donde se abra);
 *    el que falte se elige con un buscador.
 * El backend valida que el item este DISPONIBLE y el colaborador ACTIVO.
 */
export default function AsignarModal({ kind, item: fixedItem, colaborador: fixedColaborador, onClose, onDone }) {
  const cfg = KINDS[kind];
  const toast = useToast();

  const [item, setItem] = useState(fixedItem || null);
  const [colaborador, setColaborador] = useState(fixedColaborador || null);
  const [fecha, setFecha] = useState(todayISO());
  const [observaciones, setObservaciones] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const clientErrors = {};
    if (!item) clientErrors[cfg.idField] = `Selecciona ${cfg.el} ${cfg.singular}.`;
    if (!colaborador) clientErrors.colaborador_id = 'Selecciona el colaborador.';
    if (!fecha) clientErrors.fecha_asignacion = 'Indica la fecha de asignación.';
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) return;

    setSaving(true);
    try {
      const res = await asignacionService.asignar(kind, {
        [cfg.idField]: item.id,
        colaborador_id: colaborador.id,
        fecha_asignacion: fecha,
        observaciones,
      });
      toast.success(`${cfg.Singular} asignad${cfg.o} a ${colaborador.nombre_completo}.`);
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
      title={`Asignar ${cfg.singular}`}
      subtitle={`Solo se pueden asignar ${cfg.plural} disponibles a colaboradores activos.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form="asignar-form" loading={saving}>Asignar {cfg.singular}</Button>
        </>
      }
    >
      <form id="asignar-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <Field label={cfg.Singular} htmlFor="asignar-item" required error={errors[cfg.idField]}>
          <DisponiblePicker
            id="asignar-item"
            kind={kind}
            value={item}
            onChange={setItem}
            clearable={!fixedItem}
            error={errors[cfg.idField]}
          />
        </Field>

        <Field label="Colaborador" htmlFor="asignar-colaborador" required error={errors.colaborador_id}>
          <ColaboradorPicker
            id="asignar-colaborador"
            value={colaborador}
            onChange={setColaborador}
            clearable={!fixedColaborador}
            error={errors.colaborador_id}
          />
        </Field>

        <Field label="Fecha de asignación" htmlFor="asignar-fecha" required error={errors.fecha_asignacion}>
          <Input id="asignar-fecha" type="date" max={todayISO()} value={fecha} error={errors.fecha_asignacion} onChange={(e) => setFecha(e.target.value)} />
        </Field>

        <Field label="Observaciones" htmlFor="asignar-obs" error={errors.observaciones}>
          <Input
            id="asignar-obs"
            maxLength={1000}
            value={observaciones}
            error={errors.observaciones}
            placeholder="Accesorios entregados, condición de entrega…"
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </Field>
      </form>
    </Modal>
  );
}
