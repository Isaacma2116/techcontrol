import { useRef, useState } from 'react';
import { AlertCircle, FileUp } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Field, Input } from '../ui/FormField.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { cartaService } from '../../services/cartaService';
import { todayISO } from '../../utils/formatters';

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/png'];

/** Sube la copia de la carta firmada (PDF, JPG o PNG, max 10 MB). `reemplazo` = ya habia una firmada. */
export default function SubirFirmadaModal({ carta, reemplazo, onClose, onDone }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [fecha, setFecha] = useState(todayISO());
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const choose = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) return setErrors({ archivo: 'El documento debe ser un PDF, JPG o PNG.' });
    if (f.size > MAX_SIZE) return setErrors({ archivo: 'El documento no puede pesar más de 10 MB.' });
    setErrors({});
    setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!file) return setErrors({ archivo: 'Selecciona el documento firmado.' });
    if (!fecha) return setErrors({ fecha_firma: 'Indica la fecha de firma.' });

    setSaving(true);
    try {
      const res = await cartaService.subirFirmada(carta.id, file, fecha);
      toast.success(reemplazo ? 'Carta firmada reemplazada.' : 'Carta firmada registrada.');
      onDone(res.data.carta);
    } catch (err) {
      setErrors(err.errors || {});
      setFormError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={saving ? undefined : onClose}
      size="md"
      title={reemplazo ? 'Reemplazar carta firmada' : 'Subir carta firmada'}
      subtitle={carta.folio}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form="firmada-form" icon={FileUp} loading={saving}>
            {reemplazo ? 'Reemplazar' : 'Subir y marcar como firmada'}
          </Button>
        </>
      }
    >
      <form id="firmada-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{formError}</span>
          </div>
        )}
        {reemplazo && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            El documento anterior no se borra: queda guardado como versión anterior y el cambio se registra en el historial.
          </p>
        )}

        <Field label="Documento firmado" htmlFor="firmada-archivo" required error={errors.archivo} hint="PDF, JPG o PNG · máx. 10 MB">
          <input ref={inputRef} id="firmada-archivo" type="file" accept={ACCEPTED.join(',')} onChange={choose} className="hidden" />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={`flex w-full flex-col items-center gap-1 rounded-lg border-2 border-dashed px-4 py-6 text-sm transition-colors
              ${errors.archivo ? 'border-red-300 bg-red-50/40' : 'border-slate-300 hover:border-brand-500 hover:bg-brand-500/5'}`}
          >
            <FileUp size={22} className="text-slate-400" />
            {file ? (
              <span className="font-medium text-slate-800">{file.name} <span className="font-normal text-slate-400">({(file.size / 1024).toFixed(0)} KB)</span></span>
            ) : (
              <span className="text-slate-600">Haz clic para seleccionar el archivo escaneado</span>
            )}
          </button>
        </Field>

        <Field label="Fecha de firma" htmlFor="firmada-fecha" required error={errors.fecha_firma}>
          <Input id="firmada-fecha" type="date" max={todayISO()} value={fecha} error={errors.fecha_firma} onChange={(e) => setFecha(e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}
