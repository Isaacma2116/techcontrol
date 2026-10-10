import { useEffect, useState } from 'react';
import { AlertCircle, Download, Loader2 } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { saveBlob } from '../../utils/download';

/**
 * Visor de documentos protegidos (PDF o imagen). Descarga el archivo como Blob
 * (con la sesion) y lo muestra desde una URL temporal del navegador: asi no se
 * expone ninguna ruta del servidor y el iframe no depende del origen de la API.
 *
 *  - load():       Promise<Blob> que obtiene el documento
 *  - filename:     nombre con el que se descarga
 *  - onDownload:   opcional; si se pasa, reemplaza la descarga directa (p. ej. para registrarla)
 */
export default function PdfViewerModal({ title, subtitle, load, filename, onDownload, onClose }) {
  const [state, setState] = useState({ loading: true, error: '', blob: null, url: null });

  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;
    load()
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setState({ loading: false, error: '', blob, url: objectUrl });
      })
      .catch((err) => !cancelled && setState({ loading: false, error: err.message, blob: null, url: null }));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isImage = state.blob?.type?.startsWith('image/');

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={title}
      subtitle={subtitle}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
          <Button
            icon={Download}
            disabled={!state.blob}
            onClick={() => (onDownload ? onDownload(state.blob) : saveBlob(state.blob, filename))}
          >
            Descargar
          </Button>
        </>
      }
    >
      {state.loading && (
        <div className="flex h-[60vh] items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 size={18} className="animate-spin" /> Cargando documento…
        </div>
      )}
      {state.error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}
      {state.url && (isImage ? (
        <img src={state.url} alt={title} className="mx-auto max-h-[70vh] rounded-lg border border-slate-200" />
      ) : (
        <iframe src={`${state.url}#view=FitH`} title={title} className="h-[70vh] w-full rounded-lg border border-slate-200" />
      ))}
    </Modal>
  );
}
