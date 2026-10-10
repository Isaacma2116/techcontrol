import { useEffect, useState } from 'react';
import { KINDS } from '../../utils/inventarioConfig';
import { imagenUrl } from '../../services/inventarioService';

const SIZES = {
  sm: 'h-11 w-11',
  md: 'h-16 w-16',
  xl: 'h-32 w-32',
};
const ICON_SIZES = { sm: 20, md: 26, xl: 44 };

/** Miniatura de un equipo/accesorio: su imagen o, si no tiene (o falla), el icono del tipo. */
export default function ItemThumb({ kind, imagen, src, size = 'sm', className = '' }) {
  const Icon = KINDS[kind].icon;
  const url = src !== undefined ? src : imagenUrl(kind, imagen);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-900/5 text-brand-500/60 ${SIZES[size]} ${className}`}
    >
      {url && !failed ? (
        <img src={url} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <Icon size={ICON_SIZES[size]} />
      )}
    </div>
  );
}
