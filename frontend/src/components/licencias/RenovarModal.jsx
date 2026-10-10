import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Field, Input, Textarea } from '../ui/FormField.jsx';
import { useCan } from '../../hooks/useCan';
import { useToast } from '../../context/ToastContext.jsx';
import { licenciaService } from '../../services/licenciaService';
import { formatDate } from '../../utils/formatters';

/** Crea una licencia nueva ligada a esta como su renovacion (misma software/modelo/proveedor). */
export default function RenovarModal({ licencia, onClose, onDone }) {
  const toast = useToast();
  const can = useCan();
  const verCostos = can('licencias.costos_ver');

  const [values, setValues] = useState({
    cantidad_total: String(licencia.cantidad_total), fecha_inicio: '', fecha_vencimiento: '',
    costo: '', numero_contrato: '', numero_factura: '', observaciones: '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const esPerpetua = licencia.modelo.temporalidad === 'perpetua';

  const set = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };
  const bind = (name) => ({ id: `ren-${name}`, value: values[name], error: errors[name], onChange: (e) => set(name, e.target.value) });

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setFormError('');

    const payload = {
      cantidad_total: values.cantidad_total || undefined,
      fecha_inicio: values.fecha_inicio || undefined,
      fecha_vencimiento: esPerpetua ? undefined : values.fecha_vencimiento || undefined,
      observaciones: values.observaciones.trim() || undefined,
      ...(verCostos
        ? {
            costo: values.costo !== '' ? Number(values.costo) : undefined,
            numero_contrato: values.numero_contrato.trim() || undefined,
            numero_factura: values.numero_factura.trim() || undefined,
          }
        : {}),
    };

    setSaving(true);
    try {
      const res = await licenciaService.renovar(licencia.id, payload);
      toast.success(res.message);
      onDone(res.data.licencia);
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
      title={`Renovar ${licencia.codigo}`}
      subtitle={`${licencia.software.nombre} · vence ${licencia.fecha_vencimiento ? formatDate(licencia.fecha_vencimiento) : 'sin fecha'}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="form-renovar-licencia" icon={RefreshCw} loading={saving}>Crear renovación</Button>
        </>
      }
    >
      <form id="form-renovar-licencia" onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{formError}</div>}

        <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
          Se creará una licencia nueva con el mismo software, modelo y proveedor. Esta ({licencia.codigo}) queda como su antecesora.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Cantidad de puestos" htmlFor="ren-cantidad_total" error={errors.cantidad_total}>
            <Input {...bind('cantidad_total')} type="number" min="1" max="10000" />
          </Field>
          <Field label="Fecha de inicio" htmlFor="ren-fecha_inicio" error={errors.fecha_inicio} hint="Opcional">
            <Input {...bind('fecha_inicio')} type="date" />
          </Field>
          {!esPerpetua && (
            <Field label="Fecha de vencimiento" htmlFor="ren-fecha_vencimiento" error={errors.fecha_vencimiento} className="sm:col-span-2" hint="Opcional">
              <Input {...bind('fecha_vencimiento')} type="date" />
            </Field>
          )}
          {verCostos && (
            <>
              <Field label="Costo" htmlFor="ren-costo" error={errors.costo} hint="Opcional">
                <Input {...bind('costo')} type="number" min="0" step="0.01" placeholder="0.00" />
              </Field>
              <Field label="Número de contrato" htmlFor="ren-numero_contrato" error={errors.numero_contrato} hint="Opcional">
                <Input {...bind('numero_contrato')} maxLength={80} />
              </Field>
              <Field label="Número de factura" htmlFor="ren-numero_factura" error={errors.numero_factura} className="sm:col-span-2" hint="Opcional">
                <Input {...bind('numero_factura')} maxLength={80} />
              </Field>
            </>
          )}
        </div>

        <Field label="Observaciones" htmlFor="ren-observaciones" error={errors.observaciones} hint="Opcional">
          <Textarea {...bind('observaciones')} rows={2} maxLength={2000} />
        </Field>
      </form>
    </Modal>
  );
}
