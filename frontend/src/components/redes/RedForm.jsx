import { useEffect, useState } from 'react';
import { Eye, EyeOff, Save } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { Field, Input, Select, Textarea } from '../ui/FormField.jsx';
import CatalogSelect from '../colaboradores/CatalogSelect.jsx';
import ResponsableSelect from './ResponsableSelect.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { catalogoService } from '../../services/colaboradorService';
import { redService } from '../../services/redService';
import { SEGURIDAD_WIFI, TIPOS_RED } from '../../utils/redesConfig';

const CON_WIFI = new Set(['wifi', 'invitados']);

const vacio = {
  nombre: '', tipo: 'wifi', ubicacion_id: '', area_id: '', vlan_numero: '', rango_ip: '', gateway: '',
  dns: '', dhcp_habilitado: true, seguridad_wifi: 'wpa2', responsable_id: '', descripcion: '',
};

const desdeItem = (r) => ({
  nombre: r.nombre, tipo: r.tipo, ubicacion_id: r.ubicacion_id ? String(r.ubicacion_id) : '',
  area_id: r.area_id ? String(r.area_id) : '', vlan_numero: r.vlan_numero ? String(r.vlan_numero) : '',
  rango_ip: r.rango_ip || '', gateway: r.gateway || '', dns: r.dns || '', dhcp_habilitado: r.dhcp_habilitado,
  seguridad_wifi: r.seguridad_wifi || 'wpa2', responsable_id: r.responsable_id ? String(r.responsable_id) : '',
  descripcion: r.descripcion || '',
});

/** Alta o edicion de una red (Wi-Fi, LAN, VLAN, invitados, servidores...). */
export default function RedForm({ red, onClose, onSaved }) {
  const toast = useToast();
  const editar = !!red;
  const inicial = editar ? desdeItem(red) : vacio;

  const [values, setValues] = useState(inicial);
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [cambiarPassword, setCambiarPassword] = useState(!editar);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [areas, setAreas] = useState([]);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    catalogoService.list('ubicaciones').then((res) => setUbicaciones(res.data.items)).catch(() => {});
    catalogoService.list('areas').then((res) => setAreas(res.data.items)).catch(() => {});
  }, []);

  const esWifi = CON_WIFI.has(values.tipo);
  const dirty = JSON.stringify(values) !== JSON.stringify(inicial) || (cambiarPassword && password !== '');

  const set = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };
  const bind = (name) => ({ id: `red-${name}`, value: values[name], error: errors[name], onChange: (e) => set(name, e.target.value) });

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setFormError('');
    if (!values.nombre.trim()) return setErrors({ nombre: 'El nombre de la red es obligatorio.' });
    setErrors({});

    const payload = {
      ...values,
      ubicacion_id: values.ubicacion_id || null,
      area_id: values.area_id || null,
      vlan_numero: values.vlan_numero || null,
      responsable_id: values.responsable_id || null,
      seguridad_wifi: esWifi ? values.seguridad_wifi : null,
      ...(cambiarPassword ? { wifi_password: password } : {}),
    };

    setSaving(true);
    try {
      const res = editar ? await redService.update(red.id, payload) : await redService.create(payload);
      toast.success(res.message);
      onSaved(res.data.red);
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
        title={editar ? `Editar ${red.nombre}` : 'Registrar red'}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={tryClose}>Cancelar</Button>
            <Button type="submit" form="form-red" icon={Save} loading={saving}>{editar ? 'Guardar cambios' : 'Registrar red'}</Button>
          </>
        }
      >
        <form id="form-red" onSubmit={handleSubmit} noValidate className="space-y-5">
          {formError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{formError}</div>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nombre de la red / SSID" htmlFor="red-nombre" required error={errors.nombre} className="sm:col-span-2">
              <Input {...bind('nombre')} maxLength={150} />
            </Field>
            <Field label="Tipo de red" htmlFor="red-tipo" required error={errors.tipo}>
              <Select {...bind('tipo')}>
                {Object.entries(TIPOS_RED).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
              </Select>
            </Field>
            <Field label="VLAN ID" htmlFor="red-vlan_numero" error={errors.vlan_numero} hint="Opcional (1 a 4094)">
              <Input {...bind('vlan_numero')} type="number" min="1" max="4094" />
            </Field>
            <Field label="Ubicación" htmlFor="red-ubicacion_id" error={errors.ubicacion_id}>
              <CatalogSelect
                id="red-ubicacion_id" tipo="ubicaciones" singular="ubicación" items={ubicaciones}
                value={values.ubicacion_id} error={errors.ubicacion_id}
                onChange={(v) => set('ubicacion_id', v)}
                onCreated={(item) => { setUbicaciones((l) => [...l, item]); set('ubicacion_id', String(item.id)); }}
              />
            </Field>
            <Field label="Departamento / área" htmlFor="red-area_id" error={errors.area_id}>
              <CatalogSelect
                id="red-area_id" tipo="areas" singular="área" items={areas}
                value={values.area_id} error={errors.area_id}
                onChange={(v) => set('area_id', v)}
                onCreated={(item) => { setAreas((l) => [...l, item]); set('area_id', String(item.id)); }}
              />
            </Field>
            <Field label="Responsable" htmlFor="red-responsable_id" error={errors.responsable_id}>
              <ResponsableSelect id="red-responsable_id" value={values.responsable_id} error={errors.responsable_id} onChange={(v) => set('responsable_id', v)} />
            </Field>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h4 className="mb-3 text-sm font-semibold text-slate-800">Configuración de red</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Rango de IP" htmlFor="red-rango_ip" error={errors.rango_ip} hint="Opcional, ej. 192.168.10.0/24">
                <Input {...bind('rango_ip')} maxLength={43} placeholder="192.168.10.0/24" />
              </Field>
              <Field label="Gateway" htmlFor="red-gateway" error={errors.gateway} hint="Opcional">
                <Input {...bind('gateway')} maxLength={45} placeholder="192.168.10.1" />
              </Field>
              <Field label="DNS" htmlFor="red-dns" error={errors.dns} className="sm:col-span-2" hint="Opcional, separados por coma">
                <Input {...bind('dns')} maxLength={190} placeholder="8.8.8.8, 8.8.4.4" />
              </Field>
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={values.dhcp_habilitado} onChange={(e) => set('dhcp_habilitado', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500/40" />
              DHCP habilitado
            </label>
          </div>

          {esWifi && (
            <div className="border-t border-slate-100 pt-5">
              <h4 className="mb-3 text-sm font-semibold text-slate-800">Seguridad Wi-Fi</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Tipo de seguridad" htmlFor="red-seguridad_wifi" error={errors.seguridad_wifi}>
                  <Select {...bind('seguridad_wifi')}>
                    {Object.entries(SEGURIDAD_WIFI).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </Select>
                </Field>
                {values.seguridad_wifi !== 'abierta' && (
                  <Field
                    label="Contraseña Wi-Fi"
                    htmlFor="red-password"
                    error={errors.wifi_password}
                    hint={editar && !cambiarPassword ? 'Se conserva la actual. Solo un administrador puede revelarla después.' : 'Se guarda cifrada; nadie la ve directamente en las tablas.'}
                  >
                    {editar && !cambiarPassword ? (
                      <Button type="button" variant="secondary" onClick={() => setCambiarPassword(true)}>
                        {red.tiene_password ? 'Cambiar contraseña' : 'Establecer contraseña'}
                      </Button>
                    ) : (
                      <div className="relative">
                        <Input
                          id="red-password" type={passwordVisible ? 'text' : 'password'} value={password}
                          error={errors.wifi_password} onChange={(e) => setPassword(e.target.value)} maxLength={128}
                          className="pr-10" autoComplete="new-password"
                        />
                        <button type="button" onClick={() => setPasswordVisible((v) => !v)} aria-label={passwordVisible ? 'Ocultar' : 'Mostrar'} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600">
                          {passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    )}
                  </Field>
                )}
              </div>
            </div>
          )}

          <Field label="Descripción" htmlFor="red-descripcion" error={errors.descripcion} hint="Opcional">
            <Textarea {...bind('descripcion')} rows={2} maxLength={500} />
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
