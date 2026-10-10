import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import Modal from './Modal.jsx';
import Button from './Button.jsx';
import { Field, Input } from './FormField.jsx';
import { perfilService } from '../../services/perfilService';

/**
 * Paso adicional para datos sensibles: la empresa activo "Configuracion de
 * seguridad" (Empresa > Configuracion de seguridad) y el backend respondio
 * 401 con code REAUTH_REQUIRED. Se usa asi:
 *
 *   const [pedirPassword, setPedirPassword] = useState(false);
 *   ...
 *   } catch (err) {
 *     if (err.code === 'REAUTH_REQUIRED') setPedirPassword(true);
 *     else toast.error(err.message);
 *   }
 *   ...
 *   {pedirPassword && (
 *     <VerificarPasswordModal onClose={() => setPedirPassword(false)} onVerificado={() => { setPedirPassword(false); reintentarAccion(); }} />
 *   )}
 *
 * `onClose` SOLO se dispara al cancelar/cerrar (el boton X, el fondo, "Cancelar"):
 * tras verificar con exito, este componente NUNCA lo llama por su cuenta, para no
 * cerrar de mas cuando esta anidado dentro de OTRO modal (ver MostrarPasswordModal,
 * donde "verificado" debe volver a ese modal, no cerrar la ficha completa).
 * `onVerificado` es quien decide que hacer despues (cerrar, reintentar, ambas).
 */
export default function VerificarPasswordModal({ onClose, onVerificado }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [verificando, setVerificando] = useState(false);

  const confirmar = async (ev) => {
    ev.preventDefault();
    if (!password) { setError('Ingresa tu contraseña.'); return; }
    setVerificando(true);
    setError('');
    try {
      await perfilService.verificarPassword(password);
      onVerificado(); // quien llama decide que hacer despues (cerrar, reintentar la accion...)
    } catch (err) {
      setError(err.message);
    } finally {
      setVerificando(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title="Confirma tu contraseña"
      subtitle="Por seguridad, esta información requiere que vuelvas a identificarte."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button icon={ShieldCheck} loading={verificando} onClick={confirmar}>Confirmar</Button>
        </>
      }
    >
      <form onSubmit={confirmar} noValidate>
        <Field label="Contraseña" htmlFor="verificar-password" required error={error}>
          <Input
            id="verificar-password"
            type="password"
            autoFocus
            value={password}
            error={error}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            autoComplete="current-password"
          />
        </Field>
      </form>
    </Modal>
  );
}
