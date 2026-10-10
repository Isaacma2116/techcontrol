import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Link2, Pencil, PackageX, RotateCcw, Unlink } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import { Select } from '../components/ui/FormField.jsx';
import { InfoItem, InfoGroup } from '../components/ui/InfoItem.jsx';
import { SectionCard, EmptyState } from '../components/ui/SectionCard.jsx';
import { EstadoDispositivoBadge, EstadoRedBadge, TipoDispositivoBadge, TipoRedBadge } from '../components/redes/RedesBadges.jsx';
import DispositivoImagen from '../components/redes/DispositivoImagen.jsx';
import DispositivoRedForm from '../components/redes/DispositivoRedForm.jsx';
import AsociarRedModal from '../components/redes/AsociarRedModal.jsx';
import { useCan } from '../hooks/useCan';
import { useSubresource } from '../hooks/useSubresource';
import { useToast } from '../context/ToastContext.jsx';
import { dispositivoRedService } from '../services/dispositivoRedService';
import { formatDate, formatDateTime } from '../utils/formatters';
import { ESTADOS_DISPOSITIVO } from '../utils/redesConfig';

const ACCIONES_HISTORIAL = {
  creado: 'Creado', editado: 'Editado', estado_cambiado: 'Cambio de estado',
  red_asociada: 'Red asociada', red_desasociada: 'Red desasociada',
};

export default function DispositivoRedDetalle() {
  const { id } = useParams();
  const toast = useToast();
  const can = useCan();
  const canEditar = can('dispositivos_red.editar');
  const canEliminar = can('dispositivos_red.eliminar');

  const [dispositivo, setDispositivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [confirmBaja, setConfirmBaja] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const redes = useSubresource(dispositivoRedService.getRedes, 'redes', id, reloadKey);
  const hist = useSubresource(dispositivoRedService.historial, 'historial', id, reloadKey);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    dispositivoRedService.getById(id)
      .then((res) => !cancelled && setDispositivo(res.data.dispositivo))
      .catch((err) => !cancelled && setError({ status: err.status, message: err.message }))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id, reloadKey]);

  const recargar = () => setReloadKey((k) => k + 1);
  const guardado = (d) => { setModal(null); setDispositivo(d); recargar(); };

  const cambiarEstado = async (estado) => {
    setBusy(true);
    try {
      const res = await dispositivoRedService.setEstado(id, estado);
      toast.success(res.message);
      setDispositivo(res.data.dispositivo);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
      setConfirmBaja(false);
    }
  };

  const desasociar = async (redId) => {
    try {
      const res = await dispositivoRedService.desasociarRed(id, redId);
      toast.success(res.message);
      recargar();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const back = (
    <Link to="/redes?tab=dispositivos" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-500">
      <ArrowLeft size={16} /> Volver a dispositivos
    </Link>
  );

  if (loading && !dispositivo) {
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
          <h2 className="text-base font-semibold text-slate-800">{notFound ? 'Dispositivo no encontrado' : 'No se pudo cargar el dispositivo'}</h2>
          <p className="text-sm text-slate-500">{notFound ? 'Es posible que el registro ya no exista.' : error.message}</p>
          {!notFound && <Button variant="secondary" icon={RotateCcw} onClick={recargar}>Reintentar</Button>}
        </div>
      </div>
    );
  }

  const d = dispositivo;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {back}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="w-full sm:w-48">
            <DispositivoImagen dispositivo={d} onChanged={setDispositivo} canEditar={canEditar} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h2 className="text-xl font-semibold text-slate-800">{d.nombre}</h2>
              <EstadoDispositivoBadge estado={d.estado} />
              <TipoDispositivoBadge tipo={d.tipo} />
            </div>
            <p className="mt-1 text-sm text-slate-600">{d.codigo}{d.marca ? ` · ${d.marca} ${d.modelo || ''}` : ''}</p>
            <p className="mt-0.5 text-sm text-slate-400">{d.numero_serie ? `Serie: ${d.numero_serie}` : 'Sin número de serie'}</p>

            {canEditar && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button variant="secondary" icon={Pencil} onClick={() => setModal({ tipo: 'form' })}>Editar</Button>
                {canEliminar ? (
                  <Select
                    value={d.estado}
                    onChange={(e) => (e.target.value === 'baja' ? setConfirmBaja(true) : cambiarEstado(e.target.value))}
                    disabled={busy}
                    className="w-auto"
                  >
                    {Object.entries(ESTADOS_DISPOSITIVO).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                  </Select>
                ) : (
                  <Select value={d.estado} onChange={(e) => cambiarEstado(e.target.value)} disabled={busy} className="w-auto">
                    {Object.entries(ESTADOS_DISPOSITIVO).filter(([v]) => v !== 'baja').map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                  </Select>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-8 border-t border-slate-100 pt-6 md:grid-cols-2 lg:grid-cols-3">
          <InfoGroup title="Red">
            <InfoItem label="Dirección IP">{d.ip_address}</InfoItem>
            <InfoItem label="IP pública">{d.ip_publica}</InfoItem>
            <InfoItem label="Dirección MAC">{d.mac_address}</InfoItem>
            <InfoItem label="VLAN de administración">{d.vlan_admin ? `${d.vlan_admin.nombre} (VLAN ${d.vlan_admin.vlan_numero})` : null}</InfoItem>
          </InfoGroup>
          <InfoGroup title="Ubicación física">
            <InfoItem label="Ubicación">{d.ubicacion?.nombre}</InfoItem>
            <InfoItem label="Rack / Gabinete">{d.rack}</InfoItem>
            <InfoItem label="Puerto">{d.puerto}</InfoItem>
            <InfoItem label="Responsable">{d.responsable?.nombre}</InfoItem>
          </InfoGroup>
          <InfoGroup title="Compra y garantía">
            <InfoItem label="Proveedor">{d.proveedor?.nombre}</InfoItem>
            <InfoItem label="Fecha de instalación">{d.fecha_instalacion && formatDate(d.fecha_instalacion)}</InfoItem>
            <InfoItem label="Garantía vigente hasta">{d.fecha_garantia && formatDate(d.fecha_garantia)}</InfoItem>
          </InfoGroup>
          {d.observaciones && (
            <InfoGroup title="Observaciones">
              <InfoItem label="Notas" wide><span className="whitespace-pre-line">{d.observaciones}</span></InfoItem>
            </InfoGroup>
          )}
        </div>
      </section>

      <SectionCard
        title="Redes asociadas"
        description="A qué redes está conectado este dispositivo."
        count={redes.loading ? undefined : redes.items.length}
        action={canEditar && <Button variant="secondary" icon={Link2} onClick={() => setModal({ tipo: 'asociar' })}>Asociar red</Button>}
      >
        {redes.loading ? (
          <div className="space-y-2 p-5">{[0, 1].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}</div>
        ) : redes.items.length === 0 ? (
          <EmptyState message="Este dispositivo no está asociado a ninguna red todavía." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {redes.items.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <Link to={`/redes/${r.id}`} className="min-w-0 font-medium text-slate-800 hover:text-brand-500">
                  {r.nombre}{r.vlan_numero ? ` (VLAN ${r.vlan_numero})` : ''}
                </Link>
                <div className="flex shrink-0 items-center gap-3">
                  <TipoRedBadge tipo={r.tipo} />
                  <EstadoRedBadge estado={r.estado} />
                  {canEditar && (
                    <Button variant="secondary" icon={Unlink} onClick={() => desasociar(r.id)} aria-label={`Desasociar ${r.nombre}`}>Desasociar</Button>
                  )}
                </div>
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

      {modal?.tipo === 'form' && <DispositivoRedForm dispositivo={d} onClose={() => setModal(null)} onSaved={guardado} />}
      {modal?.tipo === 'asociar' && (
        <AsociarRedModal dispositivo={d} redesActuales={redes.items} onClose={() => setModal(null)} onDone={() => { setModal(null); recargar(); }} />
      )}

      <ConfirmDialog
        open={confirmBaja}
        title="Dar de baja el dispositivo"
        message="Quedará marcado como dado de baja. No se borra ningún dato ni su historial."
        confirmLabel={busy ? 'Guardando…' : 'Dar de baja'}
        variant="danger"
        onConfirm={() => cambiarEstado('baja')}
        onCancel={() => setConfirmBaja(false)}
      />
    </div>
  );
}
