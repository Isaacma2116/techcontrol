import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban, Download, Eye, FileCheck, Pencil, ScrollText, Upload } from 'lucide-react';
import PdfViewerModal from './PdfViewerModal.jsx';
import SubirFirmadaModal from './SubirFirmadaModal.jsx';
import CancelarCartaModal from './CancelarCartaModal.jsx';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext.jsx';
import { cartaService } from '../../services/cartaService';
import { saveBlob } from '../../utils/download';

const ICON_BTN =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-brand-500 disabled:opacity-50';
const TEXT_BTN =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50';

/**
 * Acciones disponibles de una carta segun su estado y el rol del usuario. Se usa
 * en el listado (variant="icons") y en el detalle (variant="buttons"): una sola
 * fuente de verdad para "que se puede hacer con esta carta".
 *
 *  - carta: { id, folio, estado }
 *  - onChanged(carta?): se llama tras subir/cancelar/descargar para refrescar la pantalla
 */
export default function CartaAcciones({ carta, variant = 'icons', showVer = true, onChanged }) {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === 'admin';
  const [busy, setBusy] = useState(false);
  const [viewer, setViewer] = useState(null);
  const [modal, setModal] = useState(null); // 'firmar' | 'cancelar'

  const { id, folio, estado } = carta;
  const tienePdf = estado !== 'borrador';
  const puedeSubir = estado === 'generada' || estado === 'pendiente_firma' || (estado === 'firmada' && isAdmin);
  const puedeCancelar = estado !== 'cancelada' && (estado !== 'firmada' || isAdmin);

  const run = async (fn, okMessage) => {
    setBusy(true);
    try {
      await fn();
      if (okMessage) toast.success(okMessage);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  // Descargar el PDF registra la descarga (y la 1.a vez pasa la carta a "pendiente de firma").
  const descargarPdf = () =>
    run(async () => {
      saveBlob(await cartaService.pdfBlob(id, true), `${folio}.pdf`);
      onChanged?.();
    }, 'PDF descargado.');

  const descargarFirmada = async () => {
    await run(async () => {
      const blob = await cartaService.firmadaBlob(id);
      saveBlob(blob, `${folio}-firmada.${blob.type === 'application/pdf' ? 'pdf' : blob.type === 'image/png' ? 'png' : 'jpg'}`);
    }, 'Documento firmado descargado.');
  };

  const actions = [
    showVer && { key: 'ver', label: 'Ver detalle', icon: Eye, to: `/cartas-responsivas/${id}` },
    estado === 'borrador' && { key: 'editar', label: 'Editar borrador', icon: Pencil, to: `/cartas-responsivas/${id}/editar` },
    estado === 'borrador' && {
      key: 'preview',
      label: 'Vista previa',
      icon: ScrollText,
      onClick: () => setViewer({ title: 'Vista previa', subtitle: `${folio} · borrador`, load: () => cartaService.previewBlob(id), filename: `${folio}-borrador.pdf` }),
    },
    tienePdf && {
      key: 'pdf',
      label: 'Descargar PDF',
      icon: Download,
      onClick: descargarPdf,
    },
    tienePdf && {
      key: 'ver-pdf',
      label: 'Ver PDF',
      icon: ScrollText,
      onClick: () => setViewer({ title: 'Carta responsiva', subtitle: folio, load: () => cartaService.pdfBlob(id, false), filename: `${folio}.pdf`, onDownload: descargarPdf }),
    },
    puedeSubir && {
      key: 'subir',
      label: estado === 'firmada' ? 'Reemplazar firmada' : 'Subir firmada',
      icon: Upload,
      onClick: () => setModal('firmar'),
    },
    estado === 'firmada' && { key: 'firmada', label: 'Descargar firmada', icon: FileCheck, onClick: descargarFirmada },
    puedeCancelar && { key: 'cancelar', label: 'Cancelar carta', icon: Ban, onClick: () => setModal('cancelar'), danger: true },
  ].filter(Boolean);

  // En el listado (icons) se omite "Ver PDF": el visor se abre desde el detalle.
  const visible = variant === 'icons' ? actions.filter((a) => a.key !== 'ver-pdf') : actions;

  return (
    <>
      <div className={variant === 'icons' ? 'flex items-center justify-end gap-1.5' : 'flex flex-wrap gap-2'}>
        {visible.map(({ key, label, icon: Icon, to, onClick, danger }) => {
          const cls = `${variant === 'icons' ? ICON_BTN : TEXT_BTN} ${danger ? 'hover:!text-red-600' : ''}`;
          const content = variant === 'icons' ? <Icon size={16} /> : (<><Icon size={16} /> {label}</>);
          return to ? (
            <Link key={key} to={to} title={label} aria-label={label} className={cls} onClick={(e) => e.stopPropagation()}>
              {content}
            </Link>
          ) : (
            <button
              key={key}
              type="button"
              title={label}
              aria-label={label}
              disabled={busy}
              className={cls}
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              {content}
            </button>
          );
        })}
      </div>

      {/* Los modales se dibujan en un portal, pero React propaga sus clics a los padres (la fila
          de la tabla navega al hacer clic): se detienen aqui para que no cierren el modal. */}
      <div onClick={(e) => e.stopPropagation()}>
      {viewer && <PdfViewerModal {...viewer} onClose={() => setViewer(null)} />}
      {modal === 'firmar' && (
        <SubirFirmadaModal
          carta={carta}
          reemplazo={estado === 'firmada'}
          onClose={() => setModal(null)}
          onDone={(updated) => {
            setModal(null);
            onChanged?.(updated);
          }}
        />
      )}
      {modal === 'cancelar' && (
        <CancelarCartaModal
          carta={carta}
          onClose={() => setModal(null)}
          onDone={(updated) => {
            setModal(null);
            onChanged?.(updated);
          }}
        />
      )}
      </div>
    </>
  );
}
