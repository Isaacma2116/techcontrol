import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, CheckCircle2, ExternalLink, Pencil, PlayCircle, XCircle } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { InfoItem } from '../ui/InfoItem.jsx';
import { EstadoMantenimientoBadge, PrioridadBadge, TipoMantenimientoBadge } from './MantenimientoBadges.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { mantenimientoService } from '../../services/mantenimientoService';
import { ACCIONES_COMPONENTE, estaAbierto, formatCosto, formatHora } from '../../utils/mantenimientosConfig';
import { formatDate, formatDateTime } from '../../utils/formatters';

const ACCIONES_HISTORIAL = {
  agendado: 'Agendado',
  editado: 'Editado',
  iniciado: 'Puesto en proceso',
  realizado: 'Registrado como realizado',
  trabajo_corregido: 'Corrección de lo realizado',
  reprogramado: 'Reprogramado',
  cancelado: 'Cancelado',
};

function Componentes({ lista }) {
  if (!lista?.length) return <p className="text-sm text-slate-400">No se registraron piezas cambiadas.</p>;
  return (
    <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
      {lista.map((c) => (
        <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-3 py-2 text-sm">
          <span className="font-medium text-slate-800">
            {ACCIONES_COMPONENTE[c.accion]}: {c.componente}
          </span>
          <span className="text-xs text-slate-500">
            {[c.detalle, c.numero_serie && `Serie: ${c.numero_serie}`, formatCosto(c.costo)].filter(Boolean).join(' · ')}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Detalle de un mantenimiento en modal (no pierde los filtros del calendario) con
 * sus acciones segun el estado. Recarga el registro completo al abrirse, porque el
 * listado no trae los componentes.
 */
export default function MantenimientoDetalle({ id, onClose, onChanged, onEditar, onRealizar, onReprogramar, onCancelar, canManage }) {
  const toast = useToast();
  const [m, setM] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError('');
    mantenimientoService
      .getById(id)
      .then((res) => !cancelled && setM(res.data.mantenimiento))
      .catch((err) => !cancelled && setError(err.message));
    mantenimientoService
      .historial(id)
      .then((res) => !cancelled && setHistorial(res.data.historial))
      .catch(() => {});
    return () => { cancelled = true; };
  }, [id]);

  const iniciar = async () => {
    setBusy(true);
    try {
      const res = await mantenimientoService.iniciar(id);
      toast.success(res.message);
      setM(res.data.mantenimiento);
      onChanged();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const abierto = estaAbierto(m);
  const realizado = m?.estado === 'realizado';

  return (
    <Modal
      open
      onClose={onClose}
      title={m ? `Mantenimiento ${m.folio}` : 'Mantenimiento'}
      subtitle={m ? `${m.recurso.codigo_inventario} · ${m.recurso.titulo || m.recurso.tipo}` : undefined}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
          {canManage && m && (abierto || realizado) && (
            <Button icon={CheckCircle2} onClick={() => onRealizar(m)}>
              {realizado ? 'Corregir lo realizado' : 'Registrar lo realizado'}
            </Button>
          )}
        </>
      }
    >
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>}
      {!m && !error && <div className="h-48 animate-pulse rounded-lg bg-slate-100" />}

      {m && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <EstadoMantenimientoBadge mantenimiento={m} />
            <TipoMantenimientoBadge tipo={m.tipo} />
            <PrioridadBadge prioridad={m.prioridad} />
          </div>

          {canManage && abierto && (
            <div className="flex flex-wrap gap-2 border-y border-slate-100 py-3">
              {m.estado === 'programado' && (
                <Button variant="secondary" icon={PlayCircle} loading={busy} onClick={iniciar}>Marcar en proceso</Button>
              )}
              <Button variant="secondary" icon={Pencil} onClick={() => onEditar(m)}>Editar</Button>
              <Button variant="secondary" icon={CalendarClock} onClick={() => onReprogramar(m)}>Reprogramar</Button>
              <Button variant="secondary" icon={XCircle} onClick={() => onCancelar(m)}>Cancelar</Button>
            </div>
          )}

          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <InfoItem label="Unidad">
              <Link to={`/${m.recurso.kind}/${m.recurso.id}`} className="inline-flex items-center gap-1 text-brand-500 hover:underline">
                {m.recurso.codigo_inventario} <ExternalLink size={13} />
              </Link>
              <span className="text-slate-500"> · {m.recurso.titulo || m.recurso.tipo}</span>
            </InfoItem>
            <InfoItem label="Programado para">
              {formatDate(m.fecha_programada)}
              {m.hora_programada && ` · ${formatHora(m.hora_programada)}`}
            </InfoItem>
            <InfoItem label="Fecha en que se hizo">{m.fecha_realizado ? formatDate(m.fecha_realizado) : null}</InfoItem>
            <InfoItem label="Costo">{formatCosto(m.costo)}</InfoItem>
            <InfoItem label="Proveedor externo">{m.proveedor}</InfoItem>
            <InfoItem label="Agendado por">
              {m.creado_por_nombre} <span className="text-slate-400">· {formatDateTime(m.created_at)}</span>
            </InfoItem>
            <InfoItem label="Qué se iba a hacer" wide>
              {m.motivo && <span className="whitespace-pre-line">{m.motivo}</span>}
            </InfoItem>
            <InfoItem label="Qué se realizó" wide>
              {m.trabajo_realizado && <span className="whitespace-pre-line">{m.trabajo_realizado}</span>}
            </InfoItem>
            {m.motivo_cancelacion && <InfoItem label="Motivo de la cancelación" wide>{m.motivo_cancelacion}</InfoItem>}
            {m.observaciones && (
              <InfoItem label="Notas internas" wide><span className="whitespace-pre-line">{m.observaciones}</span></InfoItem>
            )}
          </dl>

          {(m.reprogramado_desde || m.reprogramado_hacia) && (
            <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
              {m.reprogramado_desde && (
                <p>Viene de <strong>{m.reprogramado_desde.folio}</strong>, que estaba para el {formatDate(m.reprogramado_desde.fecha_programada)}.</p>
              )}
              {m.reprogramado_hacia && (
                <p>Se movió a <strong>{m.reprogramado_hacia.folio}</strong>, el {formatDate(m.reprogramado_hacia.fecha_programada)}.</p>
              )}
            </div>
          )}

          <div>
            <h4 className="mb-2 text-sm font-semibold text-slate-800">Componentes cambiados</h4>
            <Componentes lista={m.componentes} />
          </div>

          {historial.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-800">Historial</h4>
              <ul className="space-y-1.5">
                {historial.map((h) => (
                  <li key={h.id} className="flex flex-wrap items-baseline gap-x-2 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{ACCIONES_HISTORIAL[h.action] || h.action}</span>
                    <span>· {formatDateTime(h.created_at)}</span>
                    {h.usuario && <span>· {h.usuario}</span>}
                    {h.action === 'reprogramado' && h.details?.fecha_nueva && (
                      <span>· {formatDate(h.details.fecha_anterior)} → {formatDate(h.details.fecha_nueva)}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
