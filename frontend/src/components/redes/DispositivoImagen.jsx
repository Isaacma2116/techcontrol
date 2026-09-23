import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Router, Trash2 } from 'lucide-react';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { dispositivoRedService, dispositivoImagenUrl } from '../../services/dispositivoRedService';

const MAX_SIZE = 2 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

/** Foto del dispositivo: se sube/quita de inmediato (no depende del botón "Guardar" del formulario). */
export default function DispositivoImagen({ dispositivo, onChanged, canEditar }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [broken, setBroken] = useState(false);
  const url = dispositivoImagenUrl(dispositivo.imagen);
  useEffect(() => setBroken(false), [url]);

  const choose = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) return setError('La imagen debe ser JPG, PNG o WEBP.');
    if (file.size > MAX_SIZE) return setError('La imagen no puede pesar más de 2 MB.');

    setError('');
    setBusy(true);
    try {
      const res = await dispositivoRedService.uploadImagen(dispositivo.id, file);
      toast.success('Imagen actualizada.');
      onChanged(res.data.dispositivo);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setConfirmDelete(false);
    setBusy(true);
    try {
      const res = await dispositivoRedService.deleteImagen(dispositivo.id);
      toast.success('Imagen eliminada.');
      onChanged(res.data.dispositivo);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex h-36 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4">
        {url && !broken ? (
          <img src={url} alt={`Foto de ${dispositivo.nombre}`} className="max-h-full max-w-full object-contain" onError={() => setBroken(true)} />
        ) : (
          <div className="flex flex-col items-center gap-1 text-slate-300">
            <Router size={36} />
            <span className="text-xs text-slate-400">Sin imagen</span>
          </div>
        )}
      </div>

      {canEditar && (
        <>
          <input ref={inputRef} type="file" accept={ACCEPTED.join(',')} onChange={choose} className="hidden" aria-label="Seleccionar imagen" />
          <div className="flex gap-2">
            <Button variant="secondary" icon={ImagePlus} loading={busy} onClick={() => inputRef.current?.click()} className="flex-1">
              {dispositivo.imagen ? 'Cambiar' : 'Subir imagen'}
            </Button>
            {dispositivo.imagen && (
              <Button variant="secondary" icon={Trash2} disabled={busy} onClick={() => setConfirmDelete(true)} aria-label="Eliminar imagen" />
            )}
          </div>
          {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
        </>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar imagen"
        message="Se quitará la foto de este dispositivo."
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
