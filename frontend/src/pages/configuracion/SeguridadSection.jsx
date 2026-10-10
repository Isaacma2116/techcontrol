import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Check, Eye, EyeOff, KeyRound, LogOut, Monitor, ShieldAlert, Smartphone, ShieldCheck, X } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Switch from '../../components/ui/Switch.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { Field, Input } from '../../components/ui/FormField.jsx';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext.jsx';
import { perfilService } from '../../services/perfilService';
import { formatDateTime } from '../../utils/formatters';
import { passwordChecks } from '../../utils/passwordRules';
import { parseUserAgent, timeAgo } from '../../utils/userAgent';
import SectionShell, { FormAlert, LoadError } from './SectionShell.jsx';

function PasswordInput({ id, label, value, onChange, error, autoComplete, hint }) {
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label} htmlFor={id} required error={error} hint={hint}>
      <div className="relative">
        <Input id={id} type={visible ? 'text' : 'password'} value={value} error={error} onChange={onChange} autoComplete={autoComplete} className="pr-10" />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </Field>
  );
}

const EMPTY = { password_actual: '', password_nueva: '', password_confirmacion: '' };

function CambiarPassword({ user, onChanged }) {
  const toast = useToast();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    setErrors((x) => ({ ...x, [name]: undefined }));
  };
  const checks = passwordChecks(values.password_nueva, { username: user.username, email: user.email });
  const allOk = checks.every((c) => c.ok);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setFormError('');
    const e = {};
    if (!values.password_actual) e.password_actual = 'Ingresa tu contraseña actual.';
    if (!allOk) e.password_nueva = 'La nueva contraseña no cumple los requisitos.';
    else if (values.password_nueva === values.password_actual) e.password_nueva = 'La nueva contraseña debe ser distinta de la actual.';
    if (values.password_confirmacion !== values.password_nueva) e.password_confirmacion = 'Las contraseñas no coinciden.';
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      const res = await perfilService.changePassword(values);
      setValues(EMPTY);
      toast.success(res.message || 'Contraseña actualizada correctamente.');
      onChanged();
    } catch (err) {
      setErrors(err.errors || {});
      setFormError(err.errors ? '' : err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionShell
      icon={KeyRound}
      title="Cambiar contraseña"
      description={user.password_changed_at ? `Última actualización: ${formatDateTime(user.password_changed_at)}` : 'Usa una contraseña única que no uses en otros sitios.'}
    >
      <form onSubmit={handleSubmit} noValidate className="grid gap-6 p-5 md:grid-cols-2">
        <div className="space-y-4">
          <FormAlert>{formError}</FormAlert>
          <PasswordInput id="s-actual" label="Contraseña actual" value={values.password_actual} onChange={set('password_actual')} error={errors.password_actual} autoComplete="current-password" />
          <PasswordInput id="s-nueva" label="Nueva contraseña" value={values.password_nueva} onChange={set('password_nueva')} error={errors.password_nueva} autoComplete="new-password" />
          <PasswordInput id="s-confirmacion" label="Confirmar nueva contraseña" value={values.password_confirmacion} onChange={set('password_confirmacion')} error={errors.password_confirmacion} autoComplete="new-password" />
        </div>

        <div className="flex flex-col justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Requisitos</p>
            <ul className="space-y-1.5" aria-live="polite">
              {checks.map((c) => (
                <li key={c.id} className={`flex items-center gap-2 text-sm ${values.password_nueva ? (c.ok ? 'text-emerald-700' : 'text-slate-500') : 'text-slate-500'}`}>
                  {c.ok && values.password_nueva ? <Check size={15} className="text-emerald-600" /> : <X size={15} className="text-slate-300" />}
                  {c.label}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-500">Al cambiarla se cerrarán tus sesiones en otros dispositivos; esta seguirá abierta.</p>
          </div>
          <div className="flex justify-end">
            <Button type="submit" icon={KeyRound} loading={saving}>Actualizar contraseña</Button>
          </div>
        </div>
      </form>
    </SectionShell>
  );
}

function SesionItem({ sesion, busy, onClose }) {
  const { browser, os, mobile } = parseUserAgent(sesion.user_agent);
  const Icon = mobile ? Smartphone : Monitor;
  return (
    <li className="flex items-center gap-3 px-5 py-3.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><Icon size={18} /></div>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-800">
          {browser} en {os}
          {sesion.actual && <Badge tone="green">Esta sesión</Badge>}
        </p>
        <p className="text-xs text-slate-500">
          IP {sesion.ip || '—'} · Inició {formatDateTime(sesion.created_at)} · Activa {timeAgo(sesion.last_seen_at)}
        </p>
      </div>
      {!sesion.actual && (
        <Button variant="secondary" loading={busy} onClick={() => onClose(sesion)} aria-label={`Cerrar la sesión de ${browser} en ${os}`}>Cerrar</Button>
      )}
    </li>
  );
}

function Sesiones() {
  const toast = useToast();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [sesiones, setSesiones] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [confirmOthers, setConfirmOthers] = useState(false);
  const [closingOthers, setClosingOthers] = useState(false);

  const load = useCallback(() => {
    setLoadError('');
    return perfilService.sesiones().then((res) => setSesiones(res.data.sesiones)).catch((err) => setLoadError(err.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  const closeOne = async (sesion) => {
    setBusyId(sesion.id);
    try {
      await perfilService.closeSesion(sesion.id);
      toast.success('Sesión cerrada.');
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const closeOthers = async () => {
    setClosingOthers(true);
    try {
      const res = await perfilService.closeOtras();
      toast.success(res.message);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setClosingOthers(false);
      setConfirmOthers(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const others = sesiones?.filter((s) => !s.actual).length || 0;

  return (
    <SectionShell
      icon={ShieldCheck}
      title="Sesiones activas"
      description="Dispositivos donde tu cuenta tiene la sesión abierta. Cierra las que no reconozcas."
      action={
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={!others} onClick={() => setConfirmOthers(true)}>Cerrar otras sesiones</Button>
          <Button variant="secondary" icon={LogOut} onClick={handleLogout}>Cerrar sesión</Button>
        </div>
      }
    >
      {loadError ? (
        <div className="p-5"><LoadError message={loadError} onRetry={load} /></div>
      ) : !sesiones ? (
        <div className="space-y-3 p-5">{[0, 1].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}</div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {sesiones.map((s) => <SesionItem key={s.id} sesion={s} busy={busyId === s.id} onClose={closeOne} />)}
        </ul>
      )}

      <ConfirmDialog
        open={confirmOthers}
        title="Cerrar otras sesiones"
        message={`Se cerrará la sesión en ${others} ${others === 1 ? 'otro dispositivo' : 'otros dispositivos'}. Tu sesión actual seguirá abierta.`}
        confirmLabel={closingOthers ? 'Cerrando…' : 'Cerrar otras sesiones'}
        variant="danger"
        onConfirm={closeOthers}
        onCancel={() => setConfirmOthers(false)}
      />
    </SectionShell>
  );
}

/** Estructura lista para la autenticacion de dos pasos (aun sin flujo TOTP/QR). */
function DosFactores() {
  return (
    <SectionShell
      icon={ShieldAlert}
      title="Autenticación en dos pasos"
      description="Una capa extra de seguridad al iniciar sesión, además de tu contraseña."
      action={<Badge tone="slate">Próximamente</Badge>}
    >
      <div className="flex items-center justify-between gap-4 p-5">
        <p className="text-sm text-slate-500">
          Vas a poder activar un código adicional (aplicación autenticadora) para iniciar sesión. La estructura ya
          está lista; falta el flujo para configurarlo.
        </p>
        <Switch checked={false} disabled onChange={() => {}} label="Autenticación en dos pasos (próximamente)" />
      </div>
    </SectionShell>
  );
}

/** Seguridad: cambiar contraseña, sesiones abiertas y (estructura) dos pasos. */
export default function SeguridadSection() {
  const { user, refresh } = useAuth();

  return (
    <div className="space-y-6">
      {user.must_change_password && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p>Un administrador restableció tu contraseña. Debes crear una nueva antes de continuar usando el sistema.</p>
        </div>
      )}
      <CambiarPassword user={user} onChanged={refresh} />
      <Sesiones />
      <DosFactores />
      <p className="px-1 text-xs text-slate-500">
        ¿Olvidaste tu contraseña? Pide a un administrador que la restablezca. Para consultar información sensible
        (como contraseñas Wi-Fi) puede pedirse una confirmación adicional: lo decide un administrador en
        Configuración &gt; Empresa &gt; Configuración de seguridad.
      </p>
    </div>
  );
}
