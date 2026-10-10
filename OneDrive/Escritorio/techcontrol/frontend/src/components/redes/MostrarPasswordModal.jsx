import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Eye, EyeOff, KeyRound } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import VerificarPasswordModal from '../ui/VerificarPasswordModal.jsx';
import { redService } from '../../services/redService';

const OCULTAR_TRAS_MS = 30000;

/**
 * Revela la contraseña Wi-Fi de una red. El permiso (`redes.ver_contrasenas`)
 * ya la protege; si ADEMAS la empresa activo "Confirmar contraseña para datos
 * sensibles" (Configuracion > Empresa > Configuracion de seguridad), el
 * backend responde 401 REAUTH_REQUIRED y aqui se pide confirmar (una vez
 * cada 15 minutos por sesion, no en cada revelada). Una vez revelada se
 * oculta sola a los 30s. Cada revelacion queda en auditoria (lo hace el backend).
 */
export default function MostrarPasswordModal({ red, onClose }) {
  const [revelada, setRevelada] = useState(null);
  const [visible, setVisible] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [pedirPassword, setPedirPassword] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const intentarRevelar = async () => {
    setCargando(true);
    setError('');
    try {
      const res = await redService.revelarPassword(red.id);
      setRevelada(res.data.password);
      setVisible(true);
      timerRef.current = setTimeout(() => setVisible(false), OCULTAR_TRAS_MS);
    } catch (err) {
      if (err.code === 'REAUTH_REQUIRED') setPedirPassword(true);
      else setError(err.message);
    } finally {
      setCargando(false);
    }
  };
  useEffect(() => { intentarRevelar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(revelada);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* portapapeles no disponible; el usuario puede seleccionar el texto a mano */
    }
  };

  // Mientras se pide confirmar la contraseña, ese modal reemplaza a este (mismo flujo en toda la app).
  if (pedirPassword) {
    return <VerificarPasswordModal onClose={onClose} onVerificado={() => { setPedirPassword(false); intentarRevelar(); }} />;
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Contraseña Wi-Fi de ${red.nombre}`}
      subtitle="Se registra en auditoría cada vez que se consulta."
      size="sm"
      footer={<Button onClick={onClose}>Cerrar</Button>}
    >
      {cargando ? (
        <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
      ) : error ? (
        <div className="space-y-3">
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>
          <Button variant="secondary" icon={KeyRound} onClick={intentarRevelar}>Reintentar</Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Por seguridad, se oculta sola en unos segundos.</p>
          <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5">
            <span className="flex-1 select-all font-mono text-sm text-slate-800">
              {visible ? revelada : '•'.repeat(Math.min(revelada?.length || 8, 16))}
            </span>
            <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Ocultar' : 'Mostrar'} className="text-slate-400 hover:text-slate-600">
              {visible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button type="button" onClick={copiar} aria-label="Copiar contraseña" className="text-slate-400 hover:text-slate-600">
              {copiado ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
