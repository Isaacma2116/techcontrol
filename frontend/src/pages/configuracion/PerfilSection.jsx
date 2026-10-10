import { useState } from 'react';
import { Save, User } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { Field, Input } from '../../components/ui/FormField.jsx';
import { InfoItem } from '../../components/ui/InfoItem.jsx';
import PhotoUploader from '../../components/colaboradores/PhotoUploader.jsx';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext.jsx';
import { perfilService, perfilFotoUrl } from '../../services/perfilService';
import { formatDateTime } from '../../utils/formatters';
import { roleLabels } from '../../utils/menuConfig';
import SectionShell, { FormAlert } from './SectionShell.jsx';

const FIELDS = ['nombres', 'apellidos', 'email', 'telefono', 'cargo'];
const toValues = (u) => Object.fromEntries(FIELDS.map((f) => [f, u[f] ?? '']));
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+()\-\s.]{7,25}$/;

/** Mi perfil: datos personales editables, fotografia y datos de la cuenta (solo lectura). */
export default function PerfilSection() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [values, setValues] = useState(() => toValues(user));
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState('');

  const set = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };
  const bind = (name) => ({ id: `p-${name}`, value: values[name], error: errors[name], onChange: (e) => set(name, e.target.value) });

  const current = toValues(user);
  const dirty = FIELDS.some((f) => values[f].trim() !== current[f]);
  const emailChanged = values.email.trim().toLowerCase() !== user.email.toLowerCase();

  const validate = () => {
    const e = {};
    if (!values.nombres.trim()) e.nombres = 'El nombre es obligatorio.';
    if (!values.email.trim()) e.email = 'El correo es obligatorio.';
    else if (!EMAIL_REGEX.test(values.email.trim())) e.email = 'Ingresa un correo válido.';
    if (values.telefono.trim() && !PHONE_REGEX.test(values.telefono.trim())) e.telefono = 'Ingresa un teléfono válido (7 a 25 dígitos).';
    if (emailChanged && !password) e.password_actual = 'Ingresa tu contraseña actual para cambiar el correo.';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setFormError('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      const res = await perfilService.update({ ...values, ...(emailChanged ? { password_actual: password } : {}) });
      updateUser(res.data.user);
      setValues(toValues(res.data.user));
      setPassword('');
      toast.success('Perfil actualizado correctamente.');
    } catch (err) {
      setErrors(err.errors || {});
      setFormError(err.errors ? '' : err.message);
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = async (file) => {
    setPhotoBusy(true);
    setPhotoError('');
    try {
      const res = await perfilService.uploadFoto(file);
      updateUser(res.data.user);
      toast.success('Fotografía actualizada.');
    } catch (err) {
      setPhotoError(err.message);
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = async () => {
    setPhotoBusy(true);
    setPhotoError('');
    try {
      const res = await perfilService.deleteFoto();
      updateUser(res.data.user);
      toast.success('Fotografía eliminada.');
    } catch (err) {
      setPhotoError(err.message);
    } finally {
      setPhotoBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionShell icon={User} title="Mi perfil" description="Esta información se muestra en el sistema y en los registros de actividad.">
        <div className="grid gap-6 p-5 md:grid-cols-[13rem_1fr]">
          <div className={photoBusy ? 'pointer-events-none opacity-60' : ''}>
            <PhotoUploader
              previewUrl={perfilFotoUrl(user.foto)}
              nombre={user.nombres || user.name}
              apellido={user.apellidos}
              error={photoError}
              onSelect={uploadPhoto}
              onInvalid={setPhotoError}
              onRemove={removePhoto}
            />
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <FormAlert>{formError}</FormAlert>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nombre(s)" htmlFor="p-nombres" required error={errors.nombres}>
                <Input {...bind('nombres')} maxLength={100} autoComplete="given-name" />
              </Field>
              <Field label="Apellidos" htmlFor="p-apellidos" error={errors.apellidos}>
                <Input {...bind('apellidos')} maxLength={100} autoComplete="family-name" />
              </Field>
              <Field label="Correo electrónico" htmlFor="p-email" required error={errors.email} className="sm:col-span-2" hint="Es el correo con el que puedes iniciar sesión.">
                <Input {...bind('email')} type="email" maxLength={190} autoComplete="email" />
              </Field>
              {emailChanged && (
                <Field label="Contraseña actual" htmlFor="p-password_actual" required error={errors.password_actual} className="sm:col-span-2" hint="Por seguridad, confirma tu contraseña para cambiar el correo.">
                  <Input id="p-password_actual" type="password" value={password} error={errors.password_actual} onChange={(e) => { setPassword(e.target.value); setErrors((x) => ({ ...x, password_actual: undefined })); }} autoComplete="current-password" />
                </Field>
              )}
              <Field label="Teléfono" htmlFor="p-telefono" error={errors.telefono}>
                <Input {...bind('telefono')} type="tel" maxLength={25} autoComplete="tel" />
              </Field>
              <Field label="Cargo o puesto" htmlFor="p-cargo" error={errors.cargo}>
                <Input {...bind('cargo')} maxLength={100} placeholder="Ej. Responsable de TI" />
              </Field>
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-4">
              <Button type="submit" icon={Save} loading={saving} disabled={!dirty}>Guardar cambios</Button>
            </div>
          </form>
        </div>
      </SectionShell>

      <SectionShell title="Datos de la cuenta" description="Solo un administrador puede cambiar tu usuario, tu rol o tu estado.">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 p-5 sm:grid-cols-2">
          <InfoItem label="Usuario">{user.username}</InfoItem>
          <InfoItem label="Rol"><Badge tone="blue" dot={false}>{roleLabels[user.role] || user.role}</Badge></InfoItem>
          <InfoItem label="Último acceso">{formatDateTime(user.last_login)}</InfoItem>
          <InfoItem label="Cuenta creada">{formatDateTime(user.created_at)}</InfoItem>
        </dl>
      </SectionShell>
    </div>
  );
}
