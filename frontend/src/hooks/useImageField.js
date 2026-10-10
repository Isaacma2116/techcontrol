import { useEffect, useState } from 'react';

const MAX_SIZE = 2 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Estado de un campo de imagen en un formulario: archivo nuevo pendiente de
 * subir (`file`), marca de "quitar la actual" (`removed`) y vista previa.
 * La imagen se sube al guardar el formulario, no al elegirla.
 */
export function useImageField(currentUrl) {
  const [state, setState] = useState({ file: null, preview: null, removed: false });
  const [error, setError] = useState('');

  // Libera la URL temporal de la vista previa.
  useEffect(() => () => state.preview && URL.revokeObjectURL(state.preview), [state.preview]);

  const select = (file) => {
    if (!ACCEPTED.includes(file.type)) return setError('La imagen debe ser JPG, PNG o WEBP.');
    if (file.size > MAX_SIZE) return setError('La imagen no puede pesar más de 2 MB.');
    setError('');
    setState({ file, preview: URL.createObjectURL(file), removed: false });
  };

  const remove = () => {
    setError('');
    setState({ file: null, preview: null, removed: true });
  };

  return {
    file: state.file,
    removed: state.removed,
    dirty: !!state.file || state.removed,
    previewUrl: state.file ? state.preview : state.removed ? null : currentUrl,
    error,
    accepted: ACCEPTED,
    select,
    remove,
  };
}
