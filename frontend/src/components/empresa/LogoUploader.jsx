import { useEffect, useRef, useState } from 'react';
import { Building2, ImagePlus, Trash2 } from 'lucide-react';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { empresaService, logoUrl } from '../../services/cartaService';

const MAX_SIZE = 2 * 1024 * 1024;
const ACCEPTED = ['image/png', 'image/jpeg'];

/**
 * Logo de la empresa: vista previa, subir/cambiar y eliminar. Se guarda al elegirlo
 * (no depende del boton "Guardar" del formulario). El logo se usa en las cartas responsivas.
 */
export default function LogoUploader({ empresa, onChanged }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [broken, setBroken] = useState(false);
  const url = empresa.tiene_logo ? logoUrl(empresa.logo_version) : null;
  useEffect(() => setBroken(false), [url]);

  const choose = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) return setError('El logo debe ser una imagen PNG o JPG.');
    if (file.size > MAX_SIZE) return setError('El logo no puede pesar más de 2 MB.');

    setError('');
    setBusy(true);
    try {
      const res = await empresaService.uploadLogo(file);
      toast.success('Logo actualizado.');
      onChanged(res.data.empresa);
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
      const res = await empresaService.deleteLogo();
      toast.success('Logo eliminado.');
      onChanged(res.data.empresa);
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
          <img src={url} alt={`Logo de ${empresa.nombre}`} className="max-h-full max-w-full object-contain" onError={() => setBroken(true)} />
        ) : (
          <div className="flex flex-col items-center gap-1 text-slate-300">
            <Building2 size={40} />
            <span className="text-xs text-slate-400">Sin logo</span>
          </div>
        )}
      </div>

      <input ref={inputRef} type="file" accept={ACCEPTED.join(',')} onChange={choose} className="hidden" aria-label="Seleccionar logo" />
      <div className="flex gap-2">
        <Button variant="secondary" icon={ImagePlus} loading={busy} onClick={() => inputRef.current?.click()} className="flex-1">
          {empresa.tiene_logo ? 'Cambiar logo' : 'Subir logo'}
        </Button>
        {empresa.tiene_logo && (
          <Button variant="secondary" icon={Trash2} disabled={busy} onClick={() => setConfirmDelete(true)} aria-label="Eliminar logo" />
        )}
      </div>
      {error ? (
        <p className="text-xs text-red-600" role="alert">{error}</p>
      ) : (
        <p className="text-xs text-slate-400">PNG o JPG · máx. 2 MB. Se recomienda fondo transparente o blanco.</p>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="¿Eliminar el logo?"
        message="Las cartas nuevas se generarán sin logo. Los PDF ya generados no cambian."
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
