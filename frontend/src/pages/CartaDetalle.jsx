import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Download, Eye, FileSignature, FileX, RotateCcw } from 'lucide-react';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import { InfoGroup, InfoItem } from '../components/ui/InfoItem.jsx';
import { SectionCard, EmptyState } from '../components/ui/SectionCard.jsx';
import TipoItem from '../components/inventario/TipoItem.jsx';
import CartaEstadoBadge from '../components/cartas/CartaEstadoBadge.jsx';
import CartaAcciones from '../components/cartas/CartaAcciones.jsx';
import PdfViewerModal from '../components/cartas/PdfViewerModal.jsx';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext.jsx';
import { useSubresource } from '../hooks/useSubresource';
import { cartaService } from '../services/cartaService';
import { ACCIONES_CARTA, ESTADOS_CARTA, PLANTILLAS, TIPOS_RECURSO } from '../utils/cartasConfig';
import { KINDS } from '../utils/inventarioConfig';
import { saveBlob } from '../utils/download';
import { formatDate, formatDateTime } from '../utils/formatters';

const DOC_LABEL = { generado: 'Carta generada (PDF)', firmado: 'Carta firmada' };
const EXT = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' };

/** Texto adicional de un evento del historial (motivo, version, estado...). */
function detalleEvento(h) {
  const d = h.details || {};
  if (h.action === 'cancelada') return [d.estado_anterior && `Estado anterior: ${ESTADOS_CARTA[d.estado_anterior]?.label || d.estado_anterior}`, d.motivo && `Motivo: ${d.motivo}`].filter(Boolean).join(' · ');
  if (h.action === 'pdf_descargado' && d.estado === 'pendiente_firma') return 'La carta pasó a "Pendiente de firma".';
  if (h.action.startsWith('firmada_') && d.version) return `Versión ${d.version}${d.archivo_original ? ` · ${d.archivo_original}` : ''}`;
  if (h.action === 'creada' || h.action === 'pdf_generado') return d.folio || (d.recursos ? `${d.recursos} recurso(s)` : '');
  return '';
}

export default function CartaDetalle() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === 'admin';

  const [carta, setCarta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [viewer, setViewer] = useState(null);

  const historial = useSubresource(cartaService.getHistorial, 'historial', id, reloadKey);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    cartaService
      .getById(id)
      .then((res) => !cancelled && setCarta(res.data.carta))
      .catch((err) => !cancelled && setError({ status: err.status, message: err.message }))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id, reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  const back = (
    <Link to="/cartas-responsivas" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-500">
      <ArrowLeft size={16} /> Volver a cartas
    </Link>
  );

  if (loading && !carta) {
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
          {notFound ? <FileX size={28} className="text-slate-400" /> : <AlertCircle size={28} className="text-red-500" />}
          <h2 className="text-base font-semibold text-slate-800">{notFound ? 'Carta no encontrada' : 'No se pudo cargar la carta'}</h2>
          <p className="text-sm text-slate-500">{notFound ? 'Es posible que el registro ya no exista.' : error.message}</p>
          {!notFound && <Button variant="secondary" icon={RotateCcw} onClick={reload}>Reintentar</Button>}
        </div>
      </div>
    );
  }

  const c = carta;
  const col = c.colaborador;

  // Ver / descargar un documento concreto.
  const verDoc = (doc) => {
    const load = () => (doc.vigente ? (doc.tipo === 'generado' ? cartaService.pdfBlob(c.id, false) : cartaService.firmadaBlob(c.id)) : cartaService.documentoBlob(c.id, doc.id));
    setViewer({
      title: DOC_LABEL[doc.tipo], subtitle: `${c.folio}${doc.tipo === 'firmado' ? ` · versión ${doc.version}` : ''}`,
      load, filename: `${c.folio}.${EXT[doc.mime]}`,
    });
  };
  const descargarDoc = async (doc) => {
    try {
      const blob = doc.vigente
        ? (doc.tipo === 'generado' ? await cartaService.pdfBlob(c.id, true) : await cartaService.firmadaBlob(c.id))
        : await cartaService.documentoBlob(c.id, doc.id);
      saveBlob(blob, `${c.folio}${doc.tipo === 'firmado' ? `-firmada-v${doc.version}` : ''}.${EXT[doc.mime]}`);
      if (doc.tipo === 'generado') reload(); // la primera descarga cambia el estado
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {back}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-900/5 text-brand-500">
              <FileSignature size={26} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h2 className="text-xl font-semibold text-slate-800">{c.folio}</h2>
                <CartaEstadoBadge estado={c.estado} />
              </div>
              <p className="mt-1 text-sm text-slate-500">Carta responsiva · {PLANTILLAS[c.plantilla]}</p>
              <p className="text-sm text-slate-400">{col.nombre_completo}</p>
            </div>
          </div>
          <CartaAcciones carta={c} variant="buttons" showVer={false} onChanged={reload} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-8 border-t border-slate-100 pt-6 md:grid-cols-2 lg:grid-cols-3">
          <InfoGroup title="Información de la carta">
            <InfoItem label="Folio">{c.folio}</InfoItem>
            <InfoItem label="Estado">{ESTADOS_CARTA[c.estado]?.label}</InfoItem>
            <InfoItem label="Fecha de entrega">{formatDate(c.fecha_entrega)}</InfoItem>
            <InfoItem label="Devolución esperada">{c.fecha_devolucion_esperada && formatDate(c.fecha_devolucion_esperada)}</InfoItem>
            <InfoItem label="Creada por">{c.creado_por_nombre}</InfoItem>
            <InfoItem label="Fecha de creación">{formatDateTime(c.created_at)}</InfoItem>
            <InfoItem label="Última modificación">{c.actualizado_por_nombre && `${c.actualizado_por_nombre} · ${formatDateTime(c.updated_at)}`}</InfoItem>
            <InfoItem label="PDF generado">{c.generada_en && `${formatDateTime(c.generada_en)}${c.generada_por_nombre ? ` · ${c.generada_por_nombre}` : ''}`}</InfoItem>
            <InfoItem label="Fecha de firma">{c.fecha_firma && formatDate(c.fecha_firma)}</InfoItem>
            {c.estado === 'cancelada' && (
              <InfoItem label="Cancelada" wide>{`${formatDateTime(c.cancelada_en)}${c.cancelada_por_nombre ? ` · ${c.cancelada_por_nombre}` : ''}${c.motivo_cancelacion ? ` — ${c.motivo_cancelacion}` : ''}`}</InfoItem>
            )}
          </InfoGroup>

          <InfoGroup title="Colaborador">
            <InfoItem label="Nombre" wide>
              {col.id ? <Link to={`/colaboradores/${col.id}`} className="text-brand-500 hover:underline">{col.nombre_completo}</Link> : col.nombre_completo}
            </InfoItem>
            <InfoItem label="ID de empleado">{col.id_empleado}</InfoItem>
            <InfoItem label="Departamento">{col.area}</InfoItem>
            <InfoItem label="Cargo">{col.cargo}</InfoItem>
            <InfoItem label="Correo" wide href={col.correo_empresarial && `mailto:${col.correo_empresarial}`}>{col.correo_empresarial}</InfoItem>
          </InfoGroup>

          <InfoGroup title="Quien entrega">
            <InfoItem label="Nombre" wide>{c.entrega_nombre}</InfoItem>
            <InfoItem label="Cargo" wide>{c.entrega_cargo}</InfoItem>
            {c.observaciones && <InfoItem label="Observaciones" wide>{c.observaciones}</InfoItem>}
            {c.condiciones_especiales && <InfoItem label="Condiciones especiales" wide>{c.condiciones_especiales}</InfoItem>}
          </InfoGroup>
        </div>
      </section>

      {/* ---------- Recursos ---------- */}
      {c.recursos.map((r, i) => {
        const cfg = TIPOS_RECURSO[r.tipo];
        return (
          <SectionCard
            key={r.id}
            title={`${c.recursos.length > 1 ? `Recurso ${i + 1}: ` : 'Recurso: '}${cfg.label}`}
            description={c.congelada ? 'Datos congelados al generar la carta.' : 'Datos actuales del inventario (se congelan al generar el PDF).'}
            action={
              <div className="flex items-center gap-2">
                {r.devuelto && <Badge tone="amber">Devuelto el {formatDate(r.fecha_devolucion)}</Badge>}
                <Link to={`${KINDS[r.kind].basePath}/${r.item_id}`} className="text-sm font-medium text-brand-500 hover:underline">Ver en inventario</Link>
              </div>
            }
          >
            <div className="px-5 py-4">
              <p className="mb-3 flex items-center gap-2"><TipoItem tipo={r.campos.find((x) => x.label === 'Tipo' || x.label === 'Tipo de dispositivo')?.value || cfg.label} />
                <span className="text-sm text-slate-400">· Asignado el {formatDate(r.fecha_asignacion)}</span></p>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                {r.campos.map((f) => <InfoItem key={f.label} label={f.label}>{f.value}</InfoItem>)}
              </dl>
            </div>
          </SectionCard>
        );
      })}

      {/* ---------- Documentos ---------- */}
      <SectionCard title="Documentos" description="PDF generado y carta firmada. Al reemplazar una firmada, la versión anterior se conserva." count={c.documentos.length}>
        {c.documentos.length === 0 ? (
          <EmptyState icon={FileSignature} message={c.estado === 'borrador' ? 'El PDF se genera al pulsar "Generar PDF" en el borrador.' : 'Sin documentos.'} />
        ) : (
          <div className="table-scroll overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>{['Documento', 'Versión', 'Subido por', 'Fecha', ''].map((h, i) => <th key={i} scope="col" className="px-5 py-3 font-semibold">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {c.documentos.map((d) => {
                  const puedeVer = d.vigente || isAdmin; // las versiones anteriores solo las abre un administrador
                  return (
                    <tr key={d.id}>
                      <td className="px-5 py-3">
                        <span className="font-medium text-slate-800">{DOC_LABEL[d.tipo] || d.tipo}</span>
                        {!d.vigente && <span className="ml-2"><Badge tone="slate" dot={false}>Versión anterior</Badge></span>}
                        {d.nombre_original && d.tipo !== 'generado' && <p className="text-xs text-slate-400">{d.nombre_original} · {(d.tamano / 1024).toFixed(0)} KB</p>}
                      </td>
                      <td className="px-5 py-3">v{d.version}</td>
                      <td className="px-5 py-3">{d.subido_por || '—'}</td>
                      <td className="whitespace-nowrap px-5 py-3">{formatDateTime(d.created_at)}</td>
                      <td className="px-5 py-3">
                        {puedeVer && (
                          <div className="flex justify-end gap-1.5">
                            <button type="button" title="Ver" aria-label={`Ver ${DOC_LABEL[d.tipo]}`} onClick={() => verDoc(d)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-brand-500"><Eye size={16} /></button>
                            <button type="button" title="Descargar" aria-label={`Descargar ${DOC_LABEL[d.tipo]}`} onClick={() => descargarDoc(d)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-brand-500"><Download size={16} /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ---------- Historial ---------- */}
      <SectionCard title="Historial" description="Todo lo que ha pasado con esta carta, en orden cronológico." count={historial.loading || historial.error ? undefined : historial.items.length}>
        {historial.loading ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">Cargando historial…</p>
        ) : historial.error ? (
          <p className="px-5 py-8 text-center text-sm text-red-600">{historial.error}</p>
        ) : (
          <ol className="relative space-y-5 px-5 py-5">
            {historial.items.map((h) => (
              <li key={h.id} className="relative flex gap-3">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">{ACCIONES_CARTA[h.action] || h.action}</p>
                  <p className="text-xs text-slate-400">{h.usuario || 'Sistema'} · {formatDateTime(h.created_at)}</p>
                  {detalleEvento(h) && <p className="mt-0.5 text-xs text-slate-500">{detalleEvento(h)}</p>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </SectionCard>

      {viewer && <PdfViewerModal {...viewer} onClose={() => setViewer(null)} />}
    </div>
  );
}
