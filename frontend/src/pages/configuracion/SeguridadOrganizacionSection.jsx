import { useEffect, useState } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import Switch from '../../components/ui/Switch.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { empresaService } from '../../services/cartaService';
import { MIN_PASSWORD_LENGTH } from '../../utils/passwordRules';
import SectionShell, { LoadError } from './SectionShell.jsx';

/**
 * Politica de seguridad GLOBAL (afecta a TODOS los usuarios): a diferencia
 * del resto de "Mi cuenta", esto lo decide un administrador para la empresa
 * completa, por eso vive en Organizacion y no en Privacidad y seguridad.
 */
export default function SeguridadOrganizacionSection() {
  const toast = useToast();
  const [empresa, setEmpresa] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = () => {
    setLoadError('');
    empresaService.get().then((res) => setEmpresa(res.data.empresa)).catch((err) => setLoadError(err.message));
  };
  useEffect(cargar, []);

  const cambiar = async (valor) => {
    setGuardando(true);
    try {
      const res = await empresaService.updatePoliticaSeguridad(valor);
      setEmpresa(res.data.empresa);
      toast.success('Configuración de seguridad actualizada.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionShell
        icon={ShieldCheck}
        title="Confirmación adicional para datos sensibles"
        description="Contraseñas Wi-Fi, importar/exportar datos: pedir confirmar la contraseña de nuevo antes de mostrarlos o usarlos."
      >
        {loadError ? (
          <div className="p-5"><LoadError message={loadError} onRetry={cargar} /></div>
        ) : !empresa ? (
          <div className="p-5"><div className="h-12 animate-pulse rounded-lg bg-slate-100" /></div>
        ) : (
          <div className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-sm font-medium text-slate-800">
                {empresa.requiere_reautenticacion_sensible ? 'Activada' : 'Desactivada'}
              </p>
              <p className="text-sm text-slate-500">
                Aplica a todo el personal. La confirmación dura 15 minutos por sesión antes de volver a pedirse.
              </p>
            </div>
            <Switch
              checked={!!empresa.requiere_reautenticacion_sensible}
              disabled={guardando}
              onChange={cambiar}
              label="Requerir confirmación de contraseña para datos sensibles"
            />
          </div>
        )}
      </SectionShell>

      <SectionShell icon={KeyRound} title="Política de contraseñas" description="Aplica a todas las cuentas del sistema; se valida siempre en el servidor.">
        <div className="flex items-center gap-2 p-5 text-sm text-slate-600">
          <Badge tone="blue" dot={false}>Fija</Badge>
          Mínimo {MIN_PASSWORD_LENGTH} caracteres, con mayúscula, minúscula y número.
        </div>
      </SectionShell>
    </div>
  );
}
