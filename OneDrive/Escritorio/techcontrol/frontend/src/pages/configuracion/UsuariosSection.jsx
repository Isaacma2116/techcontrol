import { useEffect, useState } from 'react';
import {
  Check, Copy, Eye, EyeOff, KeyRound, Pencil, Power, PowerOff,
  ShieldCheck, UserPlus, Users, X,
} from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Badge, { EstadoBadge } from '../../components/ui/Badge.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { Field, Input, Select } from '../../components/ui/FormField.jsx';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext.jsx';
import { userService } from '../../services/userService';
import { formatDateTime } from '../../utils/formatters';
import { roleLabels } from '../../utils/menuConfig';
import { passwordChecks } from '../../utils/passwordRules';
import SectionShell, { FormAlert, LoadError } from './SectionShell.jsx';

const roleTone = { admin: 'blue', technician: 'slate', viewer: 'slate' };

function RoleBadge({ role }) {
  return <Badge tone={roleTone[role] || 'slate'} dot={false}>{roleLabels[role] || role}</Badge>;
}

const EMPTY_FORM = { name: '', username: '', email: '', password: '', role: 'viewer' };
const toEditValues = (u) => ({ name: u.name || '', username: u.username || '', email: u.email || '', password: '', role: u.role });

/** Alta / edicion de un usuario del sistema. Sin `usuario` = nuevo; con `usuario` = edicion (sin contraseña). */
function UserFormModal({ usuario, propio, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = !!usuario;
  const [values, setValues] = useState(() => (isEdit ? toEditValues(usuario) : EMPTY_FORM));
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    setErrors((x) => ({ ...x, [name]: undefined }));
  };

  const checks = passwordChecks(values.password, { username: values.username, email: values.email });
  const passwordOk = isEdit || checks.every((c) => c.ok);

  const validate = () => {
    const e = {};
    if (!values.name.trim()) e.name = 'El nombre es obligatorio.';
    if (!/^[a-zA-Z0-9._-]{3,50}$/.test(values.username.trim())) e.username = 'Entre 3 y 50 caracteres: letras, números, puntos, guiones y guion bajo.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) e.email = 'Ingresa un correo válido.';
    if (!isEdit && !passwordOk) e.password = 'La contraseña no cumple los requisitos.';
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
      if (isEdit) {
        await userService.update(usuario.id, {
          name: values.name.trim(),
          username: values.username.trim(),
          email: values.email.trim(),
          role: values.role,
        });
        toast.success('Usuario actualizado correctamente.');
      } else {
        await userService.create({
          name: values.name.trim(),
          username: values.username.trim(),
          email: values.email.trim(),
          password: values.password,
          role: values.role,
        });
        toast.success('Usuario creado correctamente. Se le pedirá cambiar la contraseña al iniciar sesión.');
      }
      onSaved();
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
      size="md"
      title={isEdit ? 'Editar usuario' : 'Nuevo usuario'}
      subtitle={isEdit ? usuario.username : 'La contraseña inicial la define aquí; se le pedirá cambiarla al entrar.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} loading={saving}>{isEdit ? 'Guardar cambios' : 'Crear usuario'}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormAlert>{formError}</FormAlert>

        <Field label="Nombre completo" htmlFor="u-name" required error={errors.name}>
          <Input id="u-name" value={values.name} onChange={set('name')} maxLength={150} autoComplete="name" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Usuario" htmlFor="u-username" required error={errors.username} hint="Con esto también puede iniciar sesión.">
            <Input id="u-username" value={values.username} onChange={set('username')} maxLength={50} autoComplete="username" />
          </Field>
          <Field label="Correo electrónico" htmlFor="u-email" required error={errors.email}>
            <Input id="u-email" type="email" value={values.email} onChange={set('email')} maxLength={190} autoComplete="email" />
          </Field>
        </div>

        <Field label="Rol" htmlFor="u-role" required error={errors.role} hint={propio ? 'No puedes cambiar tu propio rol.' : undefined}>
          <Select id="u-role" value={values.role} onChange={set('role')} disabled={propio}>
            <option value="viewer">Consulta</option>
            <option value="technician">Técnico TI</option>
            <option value="admin">Administrador</option>
          </Select>
        </Field>

        {!isEdit && (
          <div className="space-y-2">
            <Field label="Contraseña inicial" htmlFor="u-password" required error={errors.password}>
              <div className="relative">
                <Input id="u-password" type={showPassword ? 'text' : 'password'} value={values.password} onChange={set('password')} className="pr-10" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
            <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2" aria-live="polite">
              {checks.map((c) => (
                <li key={c.id} className={`flex items-center gap-1.5 text-xs ${values.password ? (c.ok ? 'text-emerald-700' : 'text-slate-500') : 'text-slate-500'}`}>
                  {c.ok && values.password ? <Check size={13} className="text-emerald-600" /> : <X size={13} className="text-slate-300" />}
                  {c.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </Modal>
  );
}

/** Restablece la contraseña de un usuario: pide confirmacion, genera una temporal y la muestra una sola vez. */
function ResetPasswordModal({ usuario, onClose, onDone }) {
  const toast = useToast();
  const [temporal, setTemporal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const confirmar = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await userService.resetPassword(usuario.id);
      setTemporal(res.data.passwordTemporal);
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(temporal);
      setCopied(true);
      toast.success('Contraseña copiada.');
    } catch {
      toast.error('No se pudo copiar. Selecciónala manualmente.');
    }
  };

  if (!temporal) {
    return (
      <Modal
        open
        onClose={onClose}
        size="sm"
        title="Restablecer contraseña"
        subtitle={usuario.name}
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button onClick={confirmar} loading={loading}>Restablecer</Button>
          </>
        }
      >
        <div className="space-y-3">
          {error && <FormAlert>{error}</FormAlert>}
          <p className="text-sm text-slate-600">
            Se generará una contraseña temporal para <strong>{usuario.username}</strong>. Se le pedirá crear una nueva
            al iniciar sesión, y sus sesiones activas se cerrarán.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} size="sm" title="Contraseña temporal" subtitle={usuario.name} footer={<Button onClick={onClose}>Cerrar</Button>}>
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          Compártela con <strong>{usuario.username}</strong> por un medio seguro: no volverá a mostrarse.
        </p>
        <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5">
          <code className="flex-1 select-all break-all text-sm font-semibold tracking-wide text-slate-800">{temporal}</code>
          <button type="button" onClick={copy} aria-label="Copiar contraseña" className="shrink-0 rounded p-1.5 text-slate-500 hover:bg-slate-200">
            {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
          </button>
        </div>
        <p className="text-xs text-slate-500">Al iniciar sesión, se le pedirá crear una nueva contraseña antes de poder usar el sistema.</p>
      </div>
    </Modal>
  );
}

/** Tabla de permisos por rol, de solo lectura (misma fuente que valida el backend). */
function PermisosMatriz() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    userService.permisos().then((res) => setData(res.data.matriz)).catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="p-5"><LoadError message={error} onRetry={() => window.location.reload()} /></div>;
  if (!data) return <div className="p-5"><div className="h-40 animate-pulse rounded-lg bg-slate-100" /></div>;

  return (
    <div className="table-scroll overflow-x-auto">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <th className="px-5 py-2.5">Permiso</th>
            <th className="px-3 py-2.5 text-center">Administrador</th>
            <th className="px-3 py-2.5 text-center">Técnico TI</th>
            <th className="px-3 py-2.5 text-center">Consulta</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((fila) => (
            <tr key={fila.permiso}>
              <td className="px-5 py-2 font-mono text-xs text-slate-600">{fila.permiso}</td>
              {['admin', 'technician', 'viewer'].map((r) => (
                <td key={r} className="px-3 py-2 text-center">
                  {fila.roles[r] ? <Check size={15} className="mx-auto text-emerald-600" /> : <span className="text-slate-300">—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Usuarios y permisos: alta/edicion/activacion de usuarios del sistema, y la tabla de permisos por rol. */
export default function UsuariosSection() {
  const { user: yo } = useAuth();
  const toast = useToast();
  const [usuarios, setUsuarios] = useState(null);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [formTarget, setFormTarget] = useState(undefined); // undefined = cerrado, null = nuevo, objeto = editar
  const [resetTarget, setResetTarget] = useState(null);
  const [estadoTarget, setEstadoTarget] = useState(null); // usuario a desactivar (requiere confirmacion)
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setError('');
    userService.list().then((res) => setUsuarios(res.data.users)).catch((err) => setError(err.message));
  };
  useEffect(load, [reloadKey]);

  const totalAdminsActivos = usuarios?.filter((u) => u.role === 'admin' && u.active).length ?? 0;

  const toggleEstado = async (usuario, active) => {
    setBusyId(usuario.id);
    try {
      await userService.setEstado(usuario.id, active);
      toast.success(active ? 'Usuario activado.' : 'Usuario desactivado.');
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
      setEstadoTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <SectionShell
        icon={Users}
        title="Usuarios del sistema"
        description="Quién puede entrar a TechControl y con qué rol."
        action={<Button icon={UserPlus} onClick={() => setFormTarget(null)}>Nuevo usuario</Button>}
      >
        {error ? (
          <div className="p-5"><LoadError message={error} onRetry={() => setReloadKey((k) => k + 1)} /></div>
        ) : !usuarios ? (
          <div className="space-y-2 p-5">{[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}</div>
        ) : (
          <div className="table-scroll overflow-x-auto">
            <table className="w-full min-w-[42rem] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-2.5">Usuario</th>
                  <th className="px-3 py-2.5">Rol</th>
                  <th className="px-3 py-2.5">Estado</th>
                  <th className="px-3 py-2.5">Último acceso</th>
                  <th className="px-5 py-2.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuarios.map((u) => {
                  const propio = String(u.id) === String(yo.id);
                  const esUltimoAdminActivo = u.role === 'admin' && u.active && totalAdminsActivos <= 1;
                  return (
                    <tr key={u.id}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-800">{u.name}{propio && <span className="ml-1.5 text-xs font-normal text-slate-400">(tú)</span>}</p>
                        <p className="text-xs text-slate-500">{u.username} · {u.email}</p>
                      </td>
                      <td className="px-3 py-3"><RoleBadge role={u.role} /></td>
                      <td className="px-3 py-3">
                        <EstadoBadge activo={u.active} />
                        {!!u.must_change_password && <span className="ml-1.5 inline-block"><Badge tone="amber">Contraseña pendiente</Badge></span>}
                      </td>
                      <td className="px-3 py-3 text-slate-500">{formatDateTime(u.last_login)}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <button type="button" onClick={() => setFormTarget(u)} aria-label={`Editar a ${u.name}`} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700">
                            <Pencil size={16} />
                          </button>
                          <button type="button" onClick={() => setResetTarget(u)} aria-label={`Restablecer la contraseña de ${u.name}`} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700">
                            <KeyRound size={16} />
                          </button>
                          {u.active ? (
                            <button
                              type="button"
                              disabled={propio || esUltimoAdminActivo || busyId === u.id}
                              title={propio ? 'No puedes desactivar tu propia cuenta.' : esUltimoAdminActivo ? 'Es el único administrador activo.' : 'Desactivar'}
                              onClick={() => setEstadoTarget(u)}
                              aria-label={`Desactivar a ${u.name}`}
                              className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                            >
                              <PowerOff size={16} />
                            </button>
                          ) : (
                            <button type="button" disabled={busyId === u.id} onClick={() => toggleEstado(u, true)} aria-label={`Activar a ${u.name}`} className="rounded-md p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600">
                              <Power size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionShell>

      <SectionShell icon={ShieldCheck} title="Permisos por rol" description="Lo que puede hacer cada rol; no es editable, refleja las reglas del sistema.">
        <PermisosMatriz />
      </SectionShell>

      {formTarget !== undefined && (
        <UserFormModal
          usuario={formTarget}
          propio={formTarget && String(formTarget.id) === String(yo.id)}
          onClose={() => setFormTarget(undefined)}
          onSaved={() => { setFormTarget(undefined); setReloadKey((k) => k + 1); }}
        />
      )}

      {resetTarget && (
        <ResetPasswordModal usuario={resetTarget} onClose={() => setResetTarget(null)} onDone={() => setReloadKey((k) => k + 1)} />
      )}

      <ConfirmDialog
        open={!!estadoTarget}
        title="Desactivar usuario"
        message={estadoTarget ? `${estadoTarget.name} ya no podrá iniciar sesión en TechControl. Puedes reactivarlo cuando quieras.` : ''}
        confirmLabel="Desactivar"
        variant="danger"
        onConfirm={() => toggleEstado(estadoTarget, false)}
        onCancel={() => setEstadoTarget(null)}
      />
    </div>
  );
}
