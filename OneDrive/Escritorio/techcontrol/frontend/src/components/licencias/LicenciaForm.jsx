import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { Field, Input, Select, Textarea } from '../ui/FormField.jsx';
import SoftwarePicker, { softwareLabel } from './SoftwarePicker.jsx';
import ProveedorSelect from './ProveedorSelect.jsx';
import { useCan } from '../../hooks/useCan';
import { useToast } from '../../context/ToastContext.jsx';
import { catalogoService } from '../../services/colaboradorService';
import { licenciaService } from '../../services/licenciaService';
import { AMBITO_LABEL, PERIODICIDADES } from '../../utils/licenciasConfig';

const vacio = {
  proveedor_id: '', modelo_id: '', cantidad_total: '1', activaciones_maximas: '', transferible: true,
  fecha_compra: '', fecha_inicio: '', fecha_vencimiento: '', periodicidad: 'unica', renovacion_automatica: false,
  costo: '', moneda: 'MXN', numero_contrato: '', numero_factura: '', observaciones: '',
};

const desdeItem = (l) => ({
  proveedor_id: l.proveedor_id ? String(l.proveedor_id) : '', modelo_id: String(l.modelo_id),
  cantidad_total: String(l.cantidad_total), activaciones_maximas: l.activaciones_maximas ? String(l.activaciones_maximas) : '',
  transferible: l.transferible, fecha_compra: l.fecha_compra || '', fecha_inicio: l.fecha_inicio || '',
  fecha_vencimiento: l.fecha_vencimiento || '', periodicidad: l.periodicidad, renovacion_automatica: l.renovacion_automatica,
  costo: l.costo ?? '', moneda: l.moneda || 'MXN', numero_contrato: l.numero_contrato || '', numero_factura: l.numero_factura || '',
  observaciones: l.observaciones || '',
});

/**
 * Alta o edicion de una licencia. `software` fija la unidad cuando se agenda
 * desde la ficha de un software; si no se manda, se busca con SoftwarePicker.
 */
export default function LicenciaForm({ licencia, software, onClose, onSaved }) {
  const toast = useToast();
  const can = useCan();
  const verCostos = can('licencias.costos_ver');
  const editar = !!licencia;
  const softwareFijo = !!software && !editar;

  const [values, setValues] = useState(editar ? desdeItem(licencia) : vacio);
  const [softwareSel, setSoftwareSel] = useState(
    editar ? { id: licencia.software_id, nombre: licencia.software.nombre, fabricante: null } : software || null
  );
  const [modelos, setModelos] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    catalogoService.list('modelos-licencia').then((res) => setModelos(res.data.items)).catch(() => setModelos([]));
  }, []);

  const modelo = modelos?.find((m) => String(m.id) === String(values.modelo_id));
  const esPerpetua = modelo?.temporalidad === 'perpetua';

  const inicial = editar ? desdeItem(licencia) : vacio;
  const dirty = JSON.stringify(values) !== JSON.stringify(inicial) || (!editar && !softwareFijo && !!softwareSel);

  const set = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };
  const bind = (name) => ({ id: `lic-${name}`, value: values[name], error: errors[name], onChange: (e) => set(name, e.target.value) });

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setFormError('');
    const e = {};
    if (!softwareSel) e.software_id = 'Selecciona el software.';
    if (!values.modelo_id) e.modelo_id = 'Selecciona el modelo de licencia.';
    if (!values.cantidad_total || Number(values.cantidad_total) < 1) e.cantidad_total = 'La cantidad debe ser al menos 1.';
    setErrors(e);
    if (Object.keys(e).length) return;

    const payload = {
      ...values,
      software_id: softwareSel.id,
      proveedor_id: values.proveedor_id || null,
      activaciones_maximas: values.activaciones_maximas || null,
      fecha_compra: values.fecha_compra || null,
      fecha_inicio: values.fecha_inicio || null,
      fecha_vencimiento: esPerpetua ? null : values.fecha_vencimiento || null,
      costo: verCostos && values.costo !== '' ? Number(values.costo) : null,
    };
    if (!verCostos) { delete payload.costo; delete payload.moneda; delete payload.numero_contrato; delete payload.numero_factura; }

    setSaving(true);
    try {
      const res = editar ? await licenciaService.update(licencia.id, payload) : await licenciaService.create(payload);
      toast.success(res.message);
      onSaved(res.data.licencia);
    } catch (err) {
      setErrors(err.errors || {});
      setFormError(err.errors ? '' : err.message);
    } finally {
      setSaving(false);
    }
  };

  const tryClose = () => (dirty ? setConfirmClose(true) : onClose());

  return (
    <>
      <Modal
        open
        onClose={tryClose}
        title={editar ? `Editar licencia ${licencia.codigo}` : 'Registrar licencia'}
        subtitle="Un contrato o compra de un software: cantidad de puestos, vigencia y costo."
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={tryClose}>Cancelar</Button>
            <Button type="submit" form="form-licencia" icon={Save} loading={saving}>{editar ? 'Guardar cambios' : 'Registrar licencia'}</Button>
          </>
        }
      >
        <form id="form-licencia" onSubmit={handleSubmit} noValidate className="space-y-5">
          {formError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{formError}</div>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Software" htmlFor="lic-software_id" required error={errors.software_id} className="sm:col-span-2">
              {softwareFijo || editar ? (
                <Input id="lic-software_id" readOnly className="bg-slate-50" value={softwareSel ? softwareLabel(softwareSel) : ''} />
              ) : (
                <SoftwarePicker id="lic-software_id" value={softwareSel} onChange={setSoftwareSel} error={errors.software_id} />
              )}
            </Field>

            <Field label="Modelo de licencia" htmlFor="lic-modelo_id" required error={errors.modelo_id} hint={modelo ? `Ámbito: ${AMBITO_LABEL[modelo.ambito]}` : undefined}>
              <Select {...bind('modelo_id')} disabled={!modelos}>
                <option value="">Selecciona…</option>
                {modelos?.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </Select>
            </Field>
            <Field label="Proveedor" htmlFor="lic-proveedor_id" error={errors.proveedor_id} hint="Opcional">
              <ProveedorSelect id="lic-proveedor_id" value={values.proveedor_id} error={errors.proveedor_id} onChange={(v) => set('proveedor_id', v)} />
            </Field>

            <Field label="Cantidad de puestos" htmlFor="lic-cantidad_total" required error={errors.cantidad_total} hint={editar ? `Actualmente usados: ${licencia.utilizadas}` : undefined}>
              <Input {...bind('cantidad_total')} type="number" min="1" max="10000" />
            </Field>
            <Field label="Activaciones máximas" htmlFor="lic-activaciones_maximas" error={errors.activaciones_maximas} hint="Opcional (licencias por activación)">
              <Input {...bind('activaciones_maximas')} type="number" min="1" max="10000" />
            </Field>

            <Field label="Fecha de compra" htmlFor="lic-fecha_compra" error={errors.fecha_compra} hint="Opcional">
              <Input {...bind('fecha_compra')} type="date" />
            </Field>
            <Field label="Fecha de inicio" htmlFor="lic-fecha_inicio" error={errors.fecha_inicio} hint="Opcional">
              <Input {...bind('fecha_inicio')} type="date" />
            </Field>

            {!esPerpetua && (
              <>
                <Field label="Fecha de vencimiento" htmlFor="lic-fecha_vencimiento" error={errors.fecha_vencimiento} hint="Opcional">
                  <Input {...bind('fecha_vencimiento')} type="date" />
                </Field>
                <Field label="Periodicidad" htmlFor="lic-periodicidad" error={errors.periodicidad}>
                  <Select {...bind('periodicidad')}>
                    {Object.entries(PERIODICIDADES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </Select>
                </Field>
              </>
            )}

            {verCostos && (
              <>
                <Field label="Costo" htmlFor="lic-costo" error={errors.costo} hint="Opcional">
                  <div className="flex gap-2">
                    <Input {...bind('costo')} type="number" min="0" step="0.01" placeholder="0.00" className="flex-1" />
                    <Input id="lic-moneda" value={values.moneda} onChange={(e) => set('moneda', e.target.value.toUpperCase())} maxLength={3} className="w-20 text-center uppercase" />
                  </div>
                </Field>
                <Field label="Número de contrato" htmlFor="lic-numero_contrato" error={errors.numero_contrato} hint="Opcional">
                  <Input {...bind('numero_contrato')} maxLength={80} />
                </Field>
                <Field label="Número de factura / pedido" htmlFor="lic-numero_factura" error={errors.numero_factura} hint="Opcional">
                  <Input {...bind('numero_factura')} maxLength={80} />
                </Field>
              </>
            )}
          </div>

          {!esPerpetua && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={values.renovacion_automatica} onChange={(e) => set('renovacion_automatica', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500/40" />
              Se renueva automáticamente
            </label>
          )}
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={values.transferible} onChange={(e) => set('transferible', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500/40" />
            Se puede transferir a otro colaborador/equipo
          </label>

          <Field label="Observaciones" htmlFor="lic-observaciones" error={errors.observaciones} hint="Opcional">
            <Textarea {...bind('observaciones')} rows={2} maxLength={2000} />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmClose}
        title="¿Descartar los cambios?"
        message="Si cierras ahora, lo que capturaste no se guardará."
        confirmLabel="Descartar"
        cancelLabel="Seguir editando"
        variant="danger"
        onConfirm={onClose}
        onCancel={() => setConfirmClose(false)}
      />
    </>
  );
}
