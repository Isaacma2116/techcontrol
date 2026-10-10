import { useEffect, useState } from 'react';
import { Bell, Mail } from 'lucide-react';
import Switch from '../../components/ui/Switch.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { notificacionService } from '../../services/notificacionService';
import SectionShell, { LoadError } from './SectionShell.jsx';

/**
 * Preferencias de notificaciones, por categoria: dentro del sistema (la
 * campana) y por correo (guardado ya mismo; el envio real queda pendiente de
 * un proveedor de correo — no hay SMTP configurado todavia). Solo se listan
 * las categorias que el rol del usuario puede recibir (lo decide el backend).
 */
export default function NotificacionesSection() {
  const toast = useToast();
  const [preferencias, setPreferencias] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [guardando, setGuardando] = useState(null);

  const cargar = () => {
    setLoadError('');
    notificacionService.preferencias()
      .then((res) => setPreferencias(res.data.preferencias))
      .catch((err) => setLoadError(err.message));
  };
  useEffect(cargar, []);

  const cambiar = async (categoria, campo, valor) => {
    const anterior = preferencias;
    setPreferencias((lista) => lista.map((p) => (p.categoria === categoria ? { ...p, [campo]: valor } : p)));
    setGuardando(categoria);
    try {
      const actualizada = preferencias.map((p) => (p.categoria === categoria ? { ...p, [campo]: valor } : p));
      await notificacionService.guardarPreferencias(actualizada.map((p) => ({ categoria: p.categoria, canal_sistema: p.canal_sistema, canal_correo: p.canal_correo })));
    } catch (err) {
      setPreferencias(anterior);
      toast.error(err.message);
    } finally {
      setGuardando(null);
    }
  };

  return (
    <div className="space-y-6">
      <SectionShell
        icon={Bell}
        title="Notificaciones"
        description="Elige de qué quieres enterarte, y por dónde. Respeta lo que tu rol puede consultar en el sistema."
      >
        {loadError ? (
          <div className="p-5"><LoadError message={loadError} onRetry={cargar} /></div>
        ) : !preferencias ? (
          <div className="space-y-2 p-5">{[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />)}</div>
        ) : (
          <div className="table-scroll overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-2.5">Categoría</th>
                  <th className="px-3 py-2.5 text-center"><Bell size={13} className="mx-auto" /> En el sistema</th>
                  <th className="px-3 py-2.5 text-center"><Mail size={13} className="mx-auto" /> Por correo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {preferencias.map((p) => (
                  <tr key={p.categoria} className={guardando === p.categoria ? 'opacity-60' : ''}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{p.label}</p>
                      <p className="text-xs text-slate-500">{p.descripcion}</p>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Switch checked={p.canal_sistema} onChange={(v) => cambiar(p.categoria, 'canal_sistema', v)} label={`${p.label}: en el sistema`} />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Switch checked={p.canal_correo} onChange={(v) => cambiar(p.categoria, 'canal_correo', v)} label={`${p.label}: por correo`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionShell>

      <p className="px-1 text-xs text-slate-500">
        El envío por correo todavía no está activo (no hay un proveedor de correo configurado); tu preferencia
        queda guardada y se aplicará en cuanto esté disponible.
      </p>
    </div>
  );
}
