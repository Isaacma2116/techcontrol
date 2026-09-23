import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Trash2 } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { Field, Input } from '../../components/ui/FormField.jsx';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext.jsx';
import { perfilService } from '../../services/perfilService';
import { FormAlert } from './SectionShell.jsx';

const FRASE_CONFIRMACION = 'ELIMINAR';

/**
 * Zona peligrosa: eliminar la propia cuenta. No borra la fila (hay historial que
 * apunta a ella): desactiva el acceso y borra los datos de contacto (correo,
 * telefono, fotografia); el historial de auditoria se conserva (backend:
 * perfilController.eliminarCuenta / userModel.anonymizarYDesactivar).
 */
export default function ZonaPeligrosaSection() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const listo = password.length > 0 && confirmacion === FRASE_CONFIRMACION;

  const set = (setter, field) => (e) => {
    setter(e.target.value);
    setErrors((x) => ({ ...x, [field]: undefined }));
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    setFormError('');
    const e = {};
    if (!password) e.password = 'Ingresa tu contraseña.';
    if (confirmacion !== FRASE_CONFIRMACION) e.confirmacion = `Escribe ${FRASE_CONFIRMACION} para confirmar.`;
    setErrors(e);
    if (Object.keys(e).length) return;
    setConfirmOpen(true);
  };

  const eliminarCuenta = async () => {
    setEliminando(true);
    try {
      await perfilService.eliminarCuenta({ password, confirmacion });
      toast.success('Tu cuenta se eliminó correctamente.');
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setConfirmOpen(false);
      setErrors(err.errors || {});
      setFormError(err.errors ? '' : err.message);
    } finally {
      setEliminando(false);
    }
  };

  return (
    <section className="rounded-xl border border-red-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-red-100 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600"><AlertTriangle size={18} /></div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Zona peligrosa</h3>
          <p className="text-xs text-slate-500">Acciones que no se pueden deshacer fácilmente.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4 p-5">
        <FormAlert>{formError}</FormAlert>

        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-medium">Eliminar mi cuenta</p>
          <ul className="mt-1.5 space-y-1 text-red-700">
            <li>Se desactiva tu acceso y se borran tus datos de contacto (correo, teléfono y fotografía); el historial de auditoría se conserva.</li>
            <li>Se cerrará tu sesión en todos los dispositivos.</li>
            {user.role === 'admin' && <li>No se permite si eres el último administrador activo.</li>}
          </ul>
        </div>

        <Field label="Tu contraseña" htmlFor="zp-password" required error={errors.password}>
          <Input
            id="zp-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={set(setPassword, 'password')}
          />
        </Field>

        <Field
          label={`Escribe ${FRASE_CONFIRMACION} para confirmar`}
          htmlFor="zp-confirmacion"
          required
          error={errors.confirmacion}
          hint={`Debes escribir exactamente "${FRASE_CONFIRMACION}".`}
        >
          <Input id="zp-confirmacion" value={confirmacion} onChange={set(setConfirmacion, 'confirmacion')} />
        </Field>

        <div className="flex justify-end">
          <Button type="submit" variant="danger" icon={Trash2} disabled={!listo}>Eliminar mi cuenta</Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar mi cuenta"
        message="Esta acción no se puede deshacer fácilmente: tu acceso se desactivará y se cerrará tu sesión en todos los dispositivos. ¿Continuar?"
        confirmLabel={eliminando ? 'Eliminando…' : 'Sí, eliminar mi cuenta'}
        variant="danger"
        onConfirm={eliminarCuenta}
        onCancel={() => setConfirmOpen(false)}
      />
    </section>
  );
}
