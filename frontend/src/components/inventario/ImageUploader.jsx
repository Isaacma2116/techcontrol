import { useRef } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import ItemThumb from './ItemThumb.jsx';

/**
 * Selector de imagen de un equipo/accesorio. Trabaja con useImageField:
 * el archivo se sube al guardar el formulario, no al elegirlo.
 */
export default function ImageUploader({ kind, field }) {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite volver a elegir el mismo archivo
    if (file) field.select(file);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <ItemThumb kind={kind} src={field.previewUrl} size="xl" />

      <input
        ref={inputRef}
        type="file"
        accept={field.accepted.join(',')}
        onChange={handleChange}
        className="hidden"
        aria-label="Seleccionar imagen"
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <Camera size={14} /> {field.previewUrl ? 'Cambiar' : 'Subir imagen'}
        </button>
        {field.previewUrl && (
          <button
            type="button"
            onClick={field.remove}
            aria-label="Quitar imagen"
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {field.error ? (
        <p className="max-w-[10rem] text-center text-xs text-red-600" role="alert">{field.error}</p>
      ) : (
        <p className="text-xs text-slate-400">JPG, PNG o WEBP · máx. 2 MB</p>
      )}
    </div>
  );
}
