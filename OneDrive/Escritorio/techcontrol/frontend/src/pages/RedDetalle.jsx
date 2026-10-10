import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Eye, KeyRound, PackageX, Pencil, PlayCircle, RotateCcw, ShieldOff } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import { InfoItem, InfoGroup } from '../components/ui/InfoItem.jsx';
import { SectionCard, EmptyState } from '../components/ui/SectionCard.jsx';
import { EstadoRedBadge, TipoRedBadge, EstadoDispositivoBadge, TipoDispositivoBadge } from '../components/redes/RedesBadges.jsx';
import RedForm from '../components/redes/RedForm.jsx';
import MostrarPasswordModal from '../components/redes/MostrarPasswordModal.jsx';
import { useCan } from '../hooks/useCan';
import { useSubresource } from '../hooks/useSubresource';
import { useToast } from '../context/ToastContext.jsx';
import { redService } from '../services/redService';
import { formatDateTime } from '../utils/formatters';
import { SEGURIDAD_WIFI } from '../utils/redesConfig';

const ACCIONES_HISTORIAL = {
  creada: 'Creada', editada: 'Editada', desactivada: 'Desactivada', reactivada: 'Reactivada',
  password_consultada: 'Contraseña Wi-Fi consultada',
};

export default function RedDetalle() {
  const { id } = useParams();
  const toast = useToast();
  const can = useCan();
  const canEditar = can('redes.editar');
  const canEliminar = can('redes.eliminar');
  const canVerPassword = can('redes.ver_contrasenas');

  const [red, setRed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [confirmToggle, setConfirmToggle] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const disp = useSubresource(redService.getDispositivos, 'dispositivos', id, reloadKey);
  const hist = useSubresource(redService.historial, 'historial', id, reloadKey);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    redService.getById(id)
      .then((res) => !cancelled && setRed(res.data.red))
      .catch((err) => !cancelled && setError({ status: err.status, message: err.message }))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id, reloadKey]);

  const recargar = () => setReloadKey((k) => k + 1);
  const guardado = (r) => { setModal(null); setRed(r); recargar(); };

  const toggleEstado = async () => {
    setBusy(true);
    try {
      const res = await redService.setEstado(id, red.estado === 'activa' ? 'inactiva' : 'activa');
      toast.success(res.message);
      setRed(res.data.red);
      recargar();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
      setConfirmToggle(false);
    }
  };

  const back = (
    <Link to="/redes" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-500">
      <ArrowLeft size={16} /> Volver a redes
    </Link>
  );

  if (loading && !red) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        {back}
        <div className="h-40 animate-pulse rounded-xl border border-slate-200 bg-white" />
        <div className="h-56 animate-pulse rounded-xl border border-slate-200 bg-white" />
      </div>
    );
  }

  if (error) {
    const notFound = error.status === 404 || error.status === 400;
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        {back}
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          {notFound ? <PackageX size={28} className="text-slate-400" /> : <AlertCircle size={28} className="text-red-500" />}
          <h2 className="text-base font-semibold text-slate-800">{notFound ? 'Red no encontrada' : 'No se pudo cargar la red'}</h2>
          <p className="text-sm text-slate-500">{notFound ? 'Es posible que el registro ya no exista.' : error.message}</p>
          {!notFound && <Button variant="secondary" icon={RotateCcw} onClick={recargar}>Reintentar</Button>}
        </div>
      </div>
    );
  }

  const r = red;
  const esWifi = r.tipo === 'wifi' || r.tipo === 'invitados';

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {back}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h2 className="text-xl font-semibold text-slate-800">{r.nombre}</h2>
              <EstadoRedBadge estado={r.estado} />
              <TipoRedBadge tipo={r.tipo} />
              {r.vlan_numero && <span className="text-xs text-slate-400">VLAN {r.vlan_numero}</span>}
            </div>
            <p className="mt-1 text-sm text-slate-600">{r.ubicacion?.nombre || 'Sin ubicación'}{r.area ? ` · ${r.area.nombre}` : ''}</p>
          </div>

          {canEditar && (
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <Button variant="secondary" icon={Pencil} onClick={() => setModal({ tipo: 'form' })}>Editar</Button>
              {canEliminar && (
                <Button variant="secondary" icon={r.estado === 'activa' ? ShieldOff : PlayCircle} loading={busy} onClick={() => setConfirmToggle(true)}>
                  {r.estado === 'activa' ? 'Desactivar' : 'Reactivar'}
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-8 border-t border-slate-100 pt-6 md:grid-cols-2 lg:grid-cols-3">
          <InfoGroup title="Red">
            <InfoItem label="Responsable">{r.responsable?.nombre}</InfoItem>
            <InfoItem label="DHCP">{r.dhcp_habilitado ? 'Habilitado' : 'Deshabilitado'}</InfoItem>
            <InfoItem label="Rango de IP">{r.rango_ip}</InfoItem>
            <InfoItem label="Gateway">{r.gateway}</InfoItem>
            <InfoItem label="DNS" wide>{r.dns}</InfoItem>
          </InfoGroup>
          {esWifi && (
            <InfoGroup title="Seguridad Wi-Fi">
              <InfoItem label="Tipo de seguridad">{r.seguridad_wifi ? SEGURIDAD_WIFI[r.seguridad_wifi] : null}</InfoItem>
              <InfoItem label="Contraseña">
                {!r.tiene_password ? (
                  <span className="text-slate-400">Sin contraseña</span>
                ) : canVerPassword ? (
                  <Button variant="secondary" icon={Eye} onClick={() => setModal({ tipo: 'password' })}>Mostrar contraseña</Button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-slate-500"><KeyRound size={14} /> •••••••• (solo un administrador puede verla)</span>
                )}
              </InfoItem>
            </InfoGroup>
          )}
          {r.descripcion && (
            <InfoGroup title="Descripción">
              <InfoItem label="Notas" wide><span className="whitespace-pre-line">{r.descripcion}</span></InfoItem>
            </InfoGroup>
          )}
        </div>
      </section>

      <SectionCard title="Dispositivos asociados" description="Qué equipos usan esta red." count={disp.loading ? undefined : disp.items.length}>
        {disp.loading ? (
          <div className="space-y-2 p-5">{[0, 1].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}</div>
        ) : disp.items.length === 0 ? (
          <EmptyState message="Ningún dispositivo asociado todavía." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {disp.items.map((d) => (
              <li key={d.id}>
                <Link to={`/dispositivos-red/${d.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800">{d.nombre} <span className="font-normal text-slate-500">· {d.codigo}</span></p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <TipoDispositivoBadge tipo={d.tipo} />
                    <EstadoDispositivoBadge estado={d.estado} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {hist.items.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4"><h3 className="text-sm font-semibold text-slate-800">Historial</h3></div>
          <ul className="divide-y divide-slate-100">
            {hist.items.map((h) => (
              <li key={h.id} className="flex flex-wrap items-baseline gap-x-2 px-5 py-2.5 text-xs text-slate-500">
                <span className="font-medium text-slate-700">{ACCIONES_HISTORIAL[h.action] || h.action}</span>
                <span>· {formatDateTime(h.created_at)}</span>
                {h.usuario && <span>· {h.usuario}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {modal?.tipo === 'form' && <RedForm red={r} onClose={() => setModal(null)} onSaved={guardado} />}
      {modal?.tipo === 'password' && <MostrarPasswordModal red={r} onClose={() => setModal(null)} />}

      <ConfirmDialog
        open={confirmToggle}
        title={r.estado === 'activa' ? 'Desactivar red' : 'Reactivar red'}
        message={r.estado === 'activa' ? 'La red quedará marcada como inactiva. No se borra ningún dato.' : 'La red volverá a estar disponible.'}
        confirmLabel={busy ? 'Guardando…' : r.estado === 'activa' ? 'Desactivar' : 'Reactivar'}
        variant={r.estado === 'activa' ? 'danger' : 'primary'}
        onConfirm={toggleEstado}
        onCancel={() => setConfirmToggle(false)}
      />
    </div>
  );
}
