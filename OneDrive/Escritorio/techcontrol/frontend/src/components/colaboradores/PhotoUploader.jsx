import { useRef } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';

const MAX_SIZE = 2 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Selector de fotografia con vista previa. Solo valida y avisa al padre:
 * el archivo se sube al guardar el formulario, no al elegirlo.
 */
export default function PhotoUploader({ previewUrl, nombre, apellido, error, onSelect, onInvalid, onRemove }) {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite volver a elegir el mismo archivo
    if (!file) return;

    if (!ACCEPTED.includes(file.type)) return onInvalid('La fotografía debe ser JPG, PNG o WEBP.');
    if (file.size > MAX_SIZE) return onInvalid('La fotografía no puede pesar más de 2 MB.');
    onSelect(file);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <Avatar src={previewUrl} nombre={nombre} apellido={apellido} size="xl" />

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        onChange={handleChange}
        className="hidden"
        aria-label="Seleccionar fotografía"
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <Camera size={14} /> {previewUrl ? 'Cambiar' : 'Subir foto'}
        </button>
        {previewUrl && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Quitar fotografía"
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {error ? (
        <p className="max-w-[10rem] text-center text-xs text-red-600" role="alert">{error}</p>
      ) : (
        <p className="text-xs text-slate-400">JPG, PNG o WEBP · máx. 2 MB</p>
      )}
    </div>
  );
}
