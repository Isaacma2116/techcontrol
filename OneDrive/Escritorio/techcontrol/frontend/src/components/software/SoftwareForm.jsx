import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { Field, Input, Select, Textarea } from '../ui/FormField.jsx';
import CatalogSelect from '../colaboradores/CatalogSelect.jsx';
import ProveedorSelect from '../licencias/ProveedorSelect.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { catalogoService } from '../../services/colaboradorService';
import { softwareService } from '../../services/softwareService';
import { TIPOS_SOFTWARE } from '../../utils/licenciasConfig';

const TIPOS_SIN_LICENCIA = new Set(['gratuito', 'open_source', 'freeware']);

const vacio = {
  nombre: '', fabricante_id: '', categoria_id: '', tipo: 'comercial', version_referencia: '',
  requiere_licencia: true, requiere_activacion: false, sitio_web: '', descripcion: '', observaciones: '',
};

const desdeItem = (s) => ({
  nombre: s.nombre, fabricante_id: s.fabricante_id ? String(s.fabricante_id) : '', categoria_id: s.categoria_id ? String(s.categoria_id) : '',
  tipo: s.tipo, version_referencia: s.version_referencia || '', requiere_licencia: s.requiere_licencia, requiere_activacion: s.requiere_activacion,
  sitio_web: s.sitio_web || '', descripcion: s.descripcion || '', observaciones: s.observaciones || '',
});

/** Alta o edicion de un software (el programa, no una licencia). */
export default function SoftwareForm({ software, onClose, onSaved }) {
  const toast = useToast();
  const editar = !!software;
  const inicial = editar ? desdeItem(software) : vacio;

  const [values, setValues] = useState(inicial);
  const [categorias, setCategorias] = useState([]);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    catalogoService.list('categorias-software').then((res) => setCategorias(res.data.items)).catch(() => {});
  }, []);

  const dirty = JSON.stringify(values) !== JSON.stringify(inicial);

  const set = (name, value) => {
    setValues((v) => {
      const next = { ...v, [name]: value };
      // Al elegir un tipo gratuito/open source se propone "no requiere licencia"
      // (el usuario lo puede cambiar a mano despues).
      if (name === 'tipo' && !editar) next.requiere_licencia = !TIPOS_SIN_LICENCIA.has(value);
      return next;
    });
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };
  const bind = (name) => ({ id: `sw-${name}`, value: values[name], error: errors[name], onChange: (e) => set(name, e.target.value) });

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setFormError('');
    if (!values.nombre.trim()) return setErrors({ nombre: 'El nombre es obligatorio.' });
    setErrors({});

    const payload = {
      ...values,
      fabricante_id: values.fabricante_id || null,
      categoria_id: values.categoria_id || null,
    };

    setSaving(true);
    try {
      const res = editar ? await softwareService.update(software.id, payload) : await softwareService.create(payload);
      toast.success(res.message);
      onSaved(res.data.software);
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
        title={editar ? `Editar ${software.nombre}` : 'Registrar software'}
        subtitle="El programa en sí; cada compra o contrato se registra después como una licencia."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={tryClose}>Cancelar</Button>
            <Button type="submit" form="form-software" icon={Save} loading={saving}>{editar ? 'Guardar cambios' : 'Registrar software'}</Button>
          </>
        }
      >
        <form id="form-software" onSubmit={handleSubmit} noValidate className="space-y-5">
          {formError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{formError}</div>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nombre" htmlFor="sw-nombre" required error={errors.nombre} className="sm:col-span-2">
              <Input {...bind('nombre')} maxLength={150} placeholder="Ej. AutoCAD, Microsoft 365, Google Chrome…" />
            </Field>
            <Field label="Fabricante" htmlFor="sw-fabricante_id" error={errors.fabricante_id}>
              <ProveedorSelect id="sw-fabricante_id" value={values.fabricante_id} error={errors.fabricante_id} onChange={(v) => set('fabricante_id', v)} label="Fabricante" />
            </Field>
            <Field label="Categoría" htmlFor="sw-categoria_id" error={errors.categoria_id}>
              <CatalogSelect
                id="sw-categoria_id" tipo="categorias-software" singular="categoría" items={categorias}
                value={values.categoria_id} error={errors.categoria_id}
                onChange={(v) => set('categoria_id', v)}
                onCreated={(item) => { setCategorias((l) => [...l, item]); set('categoria_id', String(item.id)); }}
              />
            </Field>
            <Field label="Tipo" htmlFor="sw-tipo" required error={errors.tipo}>
              <Select {...bind('tipo')}>
                {Object.entries(TIPOS_SOFTWARE).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
              </Select>
            </Field>
            <Field label="Versión de referencia" htmlFor="sw-version_referencia" error={errors.version_referencia} hint="Opcional">
              <Input {...bind('version_referencia')} maxLength={40} placeholder="Ej. 2026" />
            </Field>
            <Field label="Sitio web" htmlFor="sw-sitio_web" error={errors.sitio_web} className="sm:col-span-2" hint="Opcional">
              <Input {...bind('sitio_web')} maxLength={190} placeholder="autodesk.com/autocad" />
            </Field>
            <Field label="Descripción" htmlFor="sw-descripcion" error={errors.descripcion} className="sm:col-span-2" hint="Opcional">
              <Textarea {...bind('descripcion')} rows={2} maxLength={500} />
            </Field>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:gap-8">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={values.requiere_licencia} onChange={(e) => set('requiere_licencia', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500/40" />
              Requiere licencia
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={values.requiere_activacion} onChange={(e) => set('requiere_activacion', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500/40" />
              Requiere activación (product key, código…)
            </label>
          </div>

          <Field label="Observaciones" htmlFor="sw-observaciones" error={errors.observaciones} hint="Opcional">
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
