import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle, ArrowLeft, Ban, PackageX, Pencil, PlayCircle, Plus, RefreshCw, RotateCcw, ShieldOff,
} from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import { InfoItem, InfoGroup } from '../components/ui/InfoItem.jsx';
import { EstadoLicenciaBadge } from '../components/licencias/LicenciaBadges.jsx';
import PuestosBar from '../components/licencias/PuestosBar.jsx';
import AsignacionesSection from '../components/licencias/AsignacionesSection.jsx';
import LicenciaForm from '../components/licencias/LicenciaForm.jsx';
import AsignarLicenciaModal from '../components/licencias/AsignarLicenciaModal.jsx';
import LiberarModal from '../components/licencias/LiberarModal.jsx';
import TransferirModal from '../components/licencias/TransferirModal.jsx';
import RenovarModal from '../components/licencias/RenovarModal.jsx';
import { useCan } from '../hooks/useCan';
import { useSubresource } from '../hooks/useSubresource';
import { useToast } from '../context/ToastContext.jsx';
import { licenciaService } from '../services/licenciaService';
import { formatDate, formatDateTime } from '../utils/formatters';
import { AMBITO_LABEL, PERIODICIDADES, alertaVencimiento, formatCosto } from '../utils/licenciasConfig';

const ACCIONES_HISTORIAL = {
  creada: 'Creada', editada: 'Editada', asignada: 'Puesto asignado', liberada: 'Puesto liberado',
  transferida: 'Transferida', renovada: 'Renovada', suspendida: 'Suspendida', reactivada: 'Reactivada', cancelada: 'Cancelada',
};

export default function LicenciaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const can = useCan();
  const canGestionar = can('licencias.gestionar');
  const canCancelar = can('licencias.cancelar');
  const verCostos = can('licencias.costos_ver');

  const [licencia, setLicencia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [confirmCancelar, setConfirmCancelar] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState(false);

  const asig = useSubresource(licenciaService.getAsignaciones, 'asignaciones', id, reloadKey);
  const hist = useSubresource(licenciaService.historial, 'historial', id, reloadKey);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    licenciaService.getById(id)
      .then((res) => !cancelled && setLicencia(res.data.licencia))
      .catch((err) => !cancelled && setError({ status: err.status, message: err.message }))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id, reloadKey]);

  const recargar = () => setReloadKey((k) => k + 1);
  const guardado = (l) => { setModal(null); setLicencia(l); recargar(); };

  const cambiarEstado = async (estado) => {
    setBusy(true);
    try {
      const res = await licenciaService.setEstado(id, estado);
      toast.success(res.message);
      setLicencia(res.data.licencia);
      recargar();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
      setConfirmCancelar(false);
    }
  };

  const back = (
    <Link to="/licencias" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-500">
      <ArrowLeft size={16} /> Volver a licencias
    </Link>
  );

  if (loading && !licencia) {
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
          <h2 className="text-base font-semibold text-slate-800">{notFound ? 'Licencia no encontrada' : 'No se pudo cargar la licencia'}</h2>
          <p className="text-sm text-slate-500">{notFound ? 'Es posible que el registro ya no exista.' : error.message}</p>
          {!notFound && <Button variant="secondary" icon={RotateCcw} onClick={recargar}>Reintentar</Button>}
        </div>
      </div>
    );
  }

  const l = licencia;
  const alerta = alertaVencimiento(l.dias_para_vencer);
  const activa = l.estado === 'activa';

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {back}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h2 className="text-xl font-semibold text-slate-800">{l.codigo}</h2>
              <EstadoLicenciaBadge estado={l.estado_efectivo} />
              {alerta && l.estado_efectivo === 'activa' && (
                <span className={`text-xs font-medium ${alerta.tone === 'red' ? 'text-red-600' : alerta.tone === 'amber' ? 'text-amber-600' : 'text-sky-600'}`}>
                  {alerta.label}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-600">
              <Link to={`/software/${l.software.id}`} className="font-medium text-brand-500 hover:underline">{l.software.nombre}</Link>
              {' · '}{l.modelo.nombre}
            </p>
            <div className="mt-3"><PuestosBar utilizadas={l.utilizadas} total={l.cantidad_total} /></div>
          </div>

          {canGestionar && (
            <div className="flex flex-wrap gap-2 sm:justify-end">
              {activa && l.disponibles > 0 && <Button icon={Plus} onClick={() => setModal({ tipo: 'asignar' })}>Asignar puesto</Button>}
              <Button variant="secondary" icon={Pencil} onClick={() => setModal({ tipo: 'form' })} disabled={l.estado === 'cancelada'}>Editar</Button>
              <Button variant="secondary" icon={RefreshCw} onClick={() => setModal({ tipo: 'renovar' })}>Renovar</Button>
              {activa ? (
                <Button variant="secondary" icon={ShieldOff} loading={busy} onClick={() => cambiarEstado('suspendida')}>Suspender</Button>
              ) : l.estado === 'suspendida' ? (
                <Button variant="secondary" icon={PlayCircle} loading={busy} onClick={() => cambiarEstado('activa')}>Reactivar</Button>
              ) : null}
              {canCancelar && l.estado !== 'cancelada' && (
                <Button variant="danger" icon={Ban} onClick={() => setConfirmCancelar(true)}>Cancelar</Button>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-8 border-t border-slate-100 pt-6 md:grid-cols-2 lg:grid-cols-3">
          <InfoGroup title="Licencia">
            <InfoItem label="Proveedor">{l.proveedor?.nombre}</InfoItem>
            <InfoItem label="Ámbito">{AMBITO_LABEL[l.modelo.ambito]}</InfoItem>
            <InfoItem label="Activaciones máximas">{l.activaciones_maximas}</InfoItem>
            <InfoItem label="Transferible">{l.transferible ? 'Sí' : 'No'}</InfoItem>
          </InfoGroup>
          <InfoGroup title="Vigencia">
            <InfoItem label="Fecha de compra">{l.fecha_compra && formatDate(l.fecha_compra)}</InfoItem>
            <InfoItem label="Fecha de inicio">{l.fecha_inicio && formatDate(l.fecha_inicio)}</InfoItem>
            <InfoItem label="Vencimiento">{l.fecha_vencimiento ? formatDate(l.fecha_vencimiento) : 'Sin vencimiento (perpetua)'}</InfoItem>
            <InfoItem label="Periodicidad">{PERIODICIDADES[l.periodicidad]}</InfoItem>
            <InfoItem label="Renovación automática">{l.renovacion_automatica ? 'Sí' : 'No'}</InfoItem>
          </InfoGroup>
          {verCostos && (
            <InfoGroup title="Costo y contrato">
              <InfoItem label="Costo">{formatCosto(l.costo, l.moneda)}</InfoItem>
              <InfoItem label="Número de contrato">{l.numero_contrato}</InfoItem>
              <InfoItem label="Número de factura">{l.numero_factura}</InfoItem>
            </InfoGroup>
          )}
          {l.observaciones && (
            <InfoGroup title="Observaciones">
              <InfoItem label="Notas" wide><span className="whitespace-pre-line">{l.observaciones}</span></InfoItem>
            </InfoGroup>
          )}
        </div>
      </section>

      <AsignacionesSection
        asignaciones={asig.items}
        canGestionar={canGestionar && activa}
        onLiberar={(a) => setModal({ tipo: 'liberar', asignacion: a })}
        onTransferir={(a) => setModal({ tipo: 'transferir', asignacion: a })}
      />

      {hist.items.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-800">Historial</h3>
          </div>
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

      {modal?.tipo === 'form' && <LicenciaForm licencia={l} onClose={() => setModal(null)} onSaved={guardado} />}
      {modal?.tipo === 'asignar' && <AsignarLicenciaModal licencia={l} onClose={() => setModal(null)} onDone={() => { setModal(null); recargar(); }} />}
      {modal?.tipo === 'liberar' && <LiberarModal licencia={l} asignacion={modal.asignacion} onClose={() => setModal(null)} onDone={() => { setModal(null); recargar(); }} />}
      {modal?.tipo === 'transferir' && <TransferirModal licencia={l} asignacion={modal.asignacion} onClose={() => setModal(null)} onDone={() => { setModal(null); recargar(); }} />}
      {modal?.tipo === 'renovar' && (
        <RenovarModal
          licencia={l}
          onClose={() => setModal(null)}
          onDone={(nueva) => { setModal(null); navigate(`/licencias/${nueva.id}`); }}
        />
      )}

      <ConfirmDialog
        open={confirmCancelar}
        title={`Cancelar ${l.codigo}`}
        message="La licencia dejará de poder asignarse. Los puestos vigentes se conservan en el historial, pero no se liberan automáticamente."
        confirmLabel={busy ? 'Cancelando…' : 'Cancelar licencia'}
        variant="danger"
        onConfirm={() => cambiarEstado('cancelada')}
        onCancel={() => setConfirmCancelar(false)}
      />
    </div>
  );
}
