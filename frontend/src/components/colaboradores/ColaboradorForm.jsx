import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Save } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { Field, Input } from '../ui/FormField.jsx';
import FormSection from '../ui/FormSection.jsx';
import PhotoUploader from './PhotoUploader.jsx';
import CatalogSelect from './CatalogSelect.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { catalogoService, colaboradorService, fotoUrl } from '../../services/colaboradorService';
import { todayISO } from '../../utils/formatters';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+()\-\s.]{7,25}$/;

// Orden visual de los campos: sirve para enfocar el primero con error.
const FIELD_ORDER = [
  'id_empleado', 'nombre', 'apellido_paterno', 'apellido_materno',
  'area_id', 'cargo_id', 'correo_empresarial', 'telefono_empresarial', 'fecha_alta',
  'correo_personal', 'telefono_personal', 'fecha_baja',
];

function initialValues(c) {
  return {
    id_empleado: c?.id_empleado ?? '',
    nombre: c?.nombre ?? '',
    apellido_paterno: c?.apellido_paterno ?? '',
    apellido_materno: c?.apellido_materno ?? '',
    area_id: c ? String(c.area_id) : '',
    cargo_id: c ? String(c.cargo_id) : '',
    correo_empresarial: c?.correo_empresarial ?? '',
    telefono_empresarial: c?.telefono_empresarial ?? '',
    correo_personal: c?.correo_personal ?? '',
    telefono_personal: c?.telefono_personal ?? '',
    fecha_alta: c?.fecha_alta ?? '',
    activo: c ? c.activo : true,
    fecha_baja: c?.fecha_baja ?? '',
  };
}

// Mismas reglas que el backend (que sigue siendo la validacion definitiva).
function validate(v) {
  const e = {};
  const id = v.id_empleado.trim();
  if (!id) e.id_empleado = 'El ID de empleado es obligatorio.';
  else if (id.length > 30) e.id_empleado = 'El ID de empleado no puede superar 30 caracteres.';
  else if (!/^[A-Za-z0-9._-]+$/.test(id)) e.id_empleado = 'Solo letras, números, puntos, guiones y guion bajo.';

  if (!v.nombre.trim()) e.nombre = 'El nombre es obligatorio.';
  if (!v.apellido_paterno.trim()) e.apellido_paterno = 'El apellido paterno es obligatorio.';
  if (!v.area_id) e.area_id = 'Selecciona un área.';
  if (!v.cargo_id) e.cargo_id = 'Selecciona un cargo.';

  const ce = v.correo_empresarial.trim();
  if (ce && !EMAIL_REGEX.test(ce)) e.correo_empresarial = 'Ingresa un correo empresarial válido.';
  const cp = v.correo_personal.trim();
  if (cp && !EMAIL_REGEX.test(cp)) e.correo_personal = 'Ingresa un correo personal válido.';
  const te = v.telefono_empresarial.trim();
  if (te && !PHONE_REGEX.test(te)) e.telefono_empresarial = 'Ingresa un teléfono válido (7 a 25 dígitos).';
  const tp = v.telefono_personal.trim();
  if (tp && !PHONE_REGEX.test(tp)) e.telefono_personal = 'Ingresa un teléfono válido (7 a 25 dígitos).';

  if (!v.fecha_alta) e.fecha_alta = 'La fecha de ingreso es obligatoria.';

  if (!v.activo) {
    if (!v.fecha_baja) e.fecha_baja = 'Indica la fecha de baja.';
    else if (v.fecha_alta && v.fecha_baja < v.fecha_alta) {
      e.fecha_baja = 'La fecha de baja no puede ser anterior a la de ingreso.';
    }
  }
  return e;
}

/**
 * Formulario modal para crear (colaborador = null) o editar un colaborador.
 * Se monta solo cuando esta abierto, por lo que su estado nace limpio cada vez.
 */
export default function ColaboradorForm({ colaborador, onClose, onSaved }) {
  const isEdit = !!colaborador;
  const toast = useToast();

  const initial = useMemo(() => initialValues(colaborador), [colaborador]);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Fotografia: `file` = nueva seleccion pendiente de subir; `removed` = quitar la actual.
  const [foto, setFoto] = useState({ file: null, preview: null, removed: false });
  const [fotoError, setFotoError] = useState('');

  const [areas, setAreas] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [catalogError, setCatalogError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([catalogoService.list('areas'), catalogoService.list('cargos')])
      .then(([a, c]) => {
        if (cancelled) return;
        setAreas(a.data.items);
        setCargos(c.data.items);
      })
      .catch((err) => !cancelled && setCatalogError(err.message));
    return () => { cancelled = true; };
  }, []);

  // Libera la URL temporal de la vista previa.
  useEffect(() => () => foto.preview && URL.revokeObjectURL(foto.preview), [foto.preview]);

  const dirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(initial) || !!foto.file || foto.removed,
    [values, initial, foto]
  );

  const set = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };
  const bind = (name) => ({
    id: `f-${name}`,
    value: values[name],
    error: errors[name],
    onChange: (e) => set(name, e.target.value),
  });

  const toggleActivo = () => {
    setValues((v) => {
      const activo = !v.activo;
      return { ...v, activo, fecha_baja: activo ? '' : v.fecha_baja || todayISO() };
    });
    setErrors((e) => ({ ...e, fecha_baja: undefined }));
  };

  const requestClose = () => {
    if (saving) return;
    if (dirty) setConfirmDiscard(true);
    else onClose();
  };

  const focusFirstError = (errs) => {
    const first = FIELD_ORDER.find((f) => errs[f]);
    if (first) document.getElementById(`f-${first}`)?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const clientErrors = validate(values);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) return focusFirstError(clientErrors);

    const payload = {
      ...values,
      area_id: Number(values.area_id),
      cargo_id: Number(values.cargo_id),
      fecha_baja: values.activo ? '' : values.fecha_baja,
    };

    setSaving(true);
    let saved;
    try {
      const res = isEdit
        ? await colaboradorService.update(colaborador.id, payload)
        : await colaboradorService.create(payload);
      saved = res.data.colaborador;
    } catch (err) {
      if (err.errors) {
        setErrors(err.errors);
        focusFirstError(err.errors);
      }
      setFormError(err.message);
      setSaving(false);
      return;
    }

    // El registro ya existe: la foto es un segundo paso que puede fallar sin perder lo guardado.
    let fotoFailure = '';
    try {
      if (foto.file) {
        saved = (await colaboradorService.uploadFoto(saved.id, foto.file)).data.colaborador;
      } else if (foto.removed && colaborador?.fotografia) {
        saved = (await colaboradorService.deleteFoto(saved.id)).data.colaborador;
      }
    } catch (err) {
      fotoFailure = err.message;
    }

    setSaving(false);
    toast.success(isEdit ? 'Colaborador actualizado correctamente.' : 'Colaborador creado correctamente.');
    if (fotoFailure) toast.error(`Los datos se guardaron, pero la fotografía no: ${fotoFailure}`);
    onSaved(saved);
  };

  const previewUrl = foto.file ? foto.preview : foto.removed ? null : fotoUrl(colaborador?.fotografia);

  return (
    <>
      <Modal
        open
        onClose={requestClose}
        size="lg"
        title={isEdit ? 'Editar colaborador' : 'Nuevo colaborador'}
        subtitle={isEdit ? colaborador.nombre_completo : 'Completa la información del colaborador.'}
        footer={
          <>
            <Button variant="secondary" onClick={requestClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" form="colaborador-form" icon={Save} loading={saving}>
              {isEdit ? 'Guardar cambios' : 'Crear colaborador'}
            </Button>
          </>
        }
      >
        <form id="colaborador-form" onSubmit={handleSubmit} noValidate>
          {(formError || catalogError) && (
            <div role="alert" className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{formError || `No se pudieron cargar áreas y cargos: ${catalogError}`}</span>
            </div>
          )}

          <FormSection title="Información básica">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-[9rem_1fr]">
              <PhotoUploader
                previewUrl={previewUrl}
                nombre={values.nombre}
                apellido={values.apellido_paterno}
                error={fotoError}
                onSelect={(file) => {
                  setFotoError('');
                  setFoto({ file, preview: URL.createObjectURL(file), removed: false });
                }}
                onInvalid={setFotoError}
                onRemove={() => {
                  setFotoError('');
                  setFoto({ file: null, preview: null, removed: true });
                }}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="ID de empleado" htmlFor="f-id_empleado" required error={errors.id_empleado} className="sm:col-span-2">
                  <Input {...bind('id_empleado')} maxLength={30} placeholder="Ej. E-1001" autoFocus={!isEdit} />
                </Field>
                <Field label="Nombre(s)" htmlFor="f-nombre" required error={errors.nombre} className="sm:col-span-2">
                  <Input {...bind('nombre')} maxLength={100} autoComplete="off" />
                </Field>
                <Field label="Apellido paterno" htmlFor="f-apellido_paterno" required error={errors.apellido_paterno}>
                  <Input {...bind('apellido_paterno')} maxLength={100} autoComplete="off" />
                </Field>
                <Field label="Apellido materno" htmlFor="f-apellido_materno" error={errors.apellido_materno}>
                  <Input {...bind('apellido_materno')} maxLength={100} autoComplete="off" />
                </Field>
              </div>
            </div>
          </FormSection>

          <FormSection title="Información laboral">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Área" htmlFor="f-area_id" required error={errors.area_id}>
                <CatalogSelect
                  id="f-area_id"
                  tipo="areas"
                  singular="área"
                  items={areas}
                  value={values.area_id}
                  error={errors.area_id}
                  onChange={(v) => set('area_id', v)}
                  onCreated={(item) => {
                    setAreas((list) => [...list, item].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')));
                    set('area_id', String(item.id));
                  }}
                />
              </Field>
              <Field label="Cargo" htmlFor="f-cargo_id" required error={errors.cargo_id}>
                <CatalogSelect
                  id="f-cargo_id"
                  tipo="cargos"
                  singular="cargo"
                  items={cargos}
                  value={values.cargo_id}
                  error={errors.cargo_id}
                  onChange={(v) => set('cargo_id', v)}
                  onCreated={(item) => {
                    setCargos((list) => [...list, item].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')));
                    set('cargo_id', String(item.id));
                  }}
                />
              </Field>
              <Field label="Correo empresarial" htmlFor="f-correo_empresarial" error={errors.correo_empresarial}>
                <Input {...bind('correo_empresarial')} type="email" maxLength={190} placeholder="nombre@empresa.com" />
              </Field>
              <Field label="Teléfono empresarial" htmlFor="f-telefono_empresarial" error={errors.telefono_empresarial}>
                <Input {...bind('telefono_empresarial')} type="tel" maxLength={25} />
              </Field>
              <Field label="Fecha de ingreso" htmlFor="f-fecha_alta" required error={errors.fecha_alta}>
                <Input {...bind('fecha_alta')} type="date" />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Información de contacto" description="Datos personales: solo visibles para administradores y técnicos.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Correo personal" htmlFor="f-correo_personal" error={errors.correo_personal}>
                <Input {...bind('correo_personal')} type="email" maxLength={190} />
              </Field>
              <Field label="Teléfono personal" htmlFor="f-telefono_personal" error={errors.telefono_personal}>
                <Input {...bind('telefono_personal')} type="tel" maxLength={25} />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Estado">
            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
              <div>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Estado del colaborador</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={values.activo}
                  onClick={toggleActivo}
                  className="flex items-center gap-3 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                >
                  <span
                    className={`relative h-5 w-9 rounded-full transition-colors ${values.activo ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${values.activo ? 'left-[1.125rem]' : 'left-0.5'}`}
                    />
                  </span>
                  <span className="font-medium text-slate-700">{values.activo ? 'Activo' : 'Inactivo'}</span>
                </button>
              </div>
              <Field
                label="Fecha de baja"
                htmlFor="f-fecha_baja"
                required={!values.activo}
                error={errors.fecha_baja}
                hint={values.activo ? 'Se habilita al marcar al colaborador como inactivo.' : undefined}
              >
                <Input {...bind('fecha_baja')} type="date" disabled={values.activo} />
              </Field>
            </div>
          </FormSection>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmDiscard}
        title="¿Descartar los cambios?"
        message="Hay información sin guardar. Si cierras ahora, se perderá."
        confirmLabel="Descartar"
        cancelLabel="Seguir editando"
        variant="danger"
        onConfirm={onClose}
        onCancel={() => setConfirmDiscard(false)}
      />
    </>
  );
}
