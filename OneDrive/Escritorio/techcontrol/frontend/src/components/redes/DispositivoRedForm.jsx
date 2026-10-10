import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { Field, Input, Select, Textarea } from '../ui/FormField.jsx';
import CatalogSelect from '../colaboradores/CatalogSelect.jsx';
import ProveedorSelect from '../licencias/ProveedorSelect.jsx';
import ResponsableSelect from './ResponsableSelect.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { catalogoService } from '../../services/colaboradorService';
import { redService } from '../../services/redService';
import { dispositivoRedService } from '../../services/dispositivoRedService';
import { TIPOS_DISPOSITIVO } from '../../utils/redesConfig';

const vacio = {
  nombre: '', tipo: 'router', marca: '', modelo: '', numero_serie: '', mac_address: '', ip_address: '',
  ip_publica: '', ubicacion_id: '', rack: '', puerto: '', vlan_admin_id: '', responsable_id: '',
  fecha_instalacion: '', fecha_garantia: '', proveedor_id: '', observaciones: '',
};

const desdeItem = (d) => ({
  nombre: d.nombre, tipo: d.tipo, marca: d.marca || '', modelo: d.modelo || '', numero_serie: d.numero_serie || '',
  mac_address: d.mac_address || '', ip_address: d.ip_address || '', ip_publica: d.ip_publica || '',
  ubicacion_id: d.ubicacion_id ? String(d.ubicacion_id) : '', rack: d.rack || '', puerto: d.puerto || '',
  vlan_admin_id: d.vlan_admin_id ? String(d.vlan_admin_id) : '', responsable_id: d.responsable_id ? String(d.responsable_id) : '',
  fecha_instalacion: d.fecha_instalacion || '', fecha_garantia: d.fecha_garantia || '',
  proveedor_id: d.proveedor_id ? String(d.proveedor_id) : '', observaciones: d.observaciones || '',
});

/** Alta o edicion de un dispositivo de red (router, switch, access point...). */
export default function DispositivoRedForm({ dispositivo, onClose, onSaved }) {
  const toast = useToast();
  const editar = !!dispositivo;
  const inicial = editar ? desdeItem(dispositivo) : vacio;

  const [values, setValues] = useState(inicial);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [vlans, setVlans] = useState([]);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    catalogoService.list('ubicaciones').then((res) => setUbicaciones(res.data.items)).catch(() => {});
    redService.listAll().then((res) => setVlans(res.data.redes.filter((r) => r.tipo === 'vlan'))).catch(() => {});
  }, []);

  const dirty = JSON.stringify(values) !== JSON.stringify(inicial);

  const set = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };
  const bind = (name) => ({ id: `dr-${name}`, value: values[name], error: errors[name], onChange: (e) => set(name, e.target.value) });

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setFormError('');
    if (!values.nombre.trim()) return setErrors({ nombre: 'El nombre o identificador es obligatorio.' });
    setErrors({});

    const payload = {
      ...values,
      ubicacion_id: values.ubicacion_id || null,
      vlan_admin_id: values.vlan_admin_id || null,
      responsable_id: values.responsable_id || null,
      proveedor_id: values.proveedor_id || null,
      fecha_instalacion: values.fecha_instalacion || null,
      fecha_garantia: values.fecha_garantia || null,
    };

    setSaving(true);
    try {
      const res = editar ? await dispositivoRedService.update(dispositivo.id, payload) : await dispositivoRedService.create(payload);
      toast.success(res.message);
      onSaved(res.data.dispositivo);
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
        title={editar ? `Editar ${dispositivo.codigo}` : 'Registrar dispositivo de red'}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={tryClose}>Cancelar</Button>
            <Button type="submit" form="form-dispositivo-red" icon={Save} loading={saving}>{editar ? 'Guardar cambios' : 'Registrar dispositivo'}</Button>
          </>
        }
      >
        <form id="form-dispositivo-red" onSubmit={handleSubmit} noValidate className="space-y-5">
          {formError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{formError}</div>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nombre o identificador" htmlFor="dr-nombre" required error={errors.nombre} className="sm:col-span-2">
              <Input {...bind('nombre')} maxLength={150} placeholder="Ej. Router principal, SW-01…" />
            </Field>
            <Field label="Tipo de dispositivo" htmlFor="dr-tipo" required error={errors.tipo}>
              <Select {...bind('tipo')}>
                {Object.entries(TIPOS_DISPOSITIVO).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
              </Select>
            </Field>
            <Field label="Proveedor" htmlFor="dr-proveedor_id" error={errors.proveedor_id} hint="Opcional">
              <ProveedorSelect id="dr-proveedor_id" value={values.proveedor_id} error={errors.proveedor_id} onChange={(v) => set('proveedor_id', v)} />
            </Field>
            <Field label="Marca" htmlFor="dr-marca" error={errors.marca} hint="Opcional">
              <Input {...bind('marca')} maxLength={80} />
            </Field>
            <Field label="Modelo" htmlFor="dr-modelo" error={errors.modelo} hint="Opcional">
              <Input {...bind('modelo')} maxLength={120} />
            </Field>
            <Field label="Número de serie" htmlFor="dr-numero_serie" error={errors.numero_serie} hint="Opcional">
              <Input {...bind('numero_serie')} maxLength={120} />
            </Field>
            <Field label="Dirección MAC" htmlFor="dr-mac_address" error={errors.mac_address} hint="Opcional, ej. AA:BB:CC:DD:EE:FF">
              <Input {...bind('mac_address')} maxLength={17} placeholder="AA:BB:CC:DD:EE:FF" />
            </Field>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h4 className="mb-3 text-sm font-semibold text-slate-800">Red y ubicación física</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Dirección IP" htmlFor="dr-ip_address" error={errors.ip_address} hint="Opcional">
                <Input {...bind('ip_address')} maxLength={45} placeholder="192.168.1.1" />
              </Field>
              <Field label="IP pública" htmlFor="dr-ip_publica" error={errors.ip_publica} hint="Opcional">
                <Input {...bind('ip_publica')} maxLength={45} />
              </Field>
              <Field label="VLAN de administración" htmlFor="dr-vlan_admin_id" error={errors.vlan_admin_id} hint="Opcional; una red de tipo VLAN">
                <Select {...bind('vlan_admin_id')}>
                  <option value="">Ninguna</option>
                  {vlans.map((v) => <option key={v.id} value={v.id}>{v.nombre} (VLAN {v.vlan_numero})</option>)}
                </Select>
              </Field>
              <Field label="Ubicación" htmlFor="dr-ubicacion_id" error={errors.ubicacion_id}>
                <CatalogSelect
                  id="dr-ubicacion_id" tipo="ubicaciones" singular="ubicación" items={ubicaciones}
                  value={values.ubicacion_id} error={errors.ubicacion_id}
                  onChange={(v) => set('ubicacion_id', v)}
                  onCreated={(item) => { setUbicaciones((l) => [...l, item]); set('ubicacion_id', String(item.id)); }}
                />
              </Field>
              <Field label="Rack / Gabinete" htmlFor="dr-rack" error={errors.rack} hint="Opcional">
                <Input {...bind('rack')} maxLength={80} />
              </Field>
              <Field label="Puerto" htmlFor="dr-puerto" error={errors.puerto} hint="Opcional">
                <Input {...bind('puerto')} maxLength={40} />
              </Field>
              <Field label="Responsable" htmlFor="dr-responsable_id" error={errors.responsable_id}>
                <ResponsableSelect id="dr-responsable_id" value={values.responsable_id} error={errors.responsable_id} onChange={(v) => set('responsable_id', v)} />
              </Field>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h4 className="mb-3 text-sm font-semibold text-slate-800">Instalación y garantía</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Fecha de instalación" htmlFor="dr-fecha_instalacion" error={errors.fecha_instalacion} hint="Opcional">
                <Input {...bind('fecha_instalacion')} type="date" />
              </Field>
              <Field label="Garantía vigente hasta" htmlFor="dr-fecha_garantia" error={errors.fecha_garantia} hint="Opcional">
                <Input {...bind('fecha_garantia')} type="date" />
              </Field>
            </div>
          </div>

          <Field label="Observaciones" htmlFor="dr-observaciones" error={errors.observaciones} hint="Opcional">
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
