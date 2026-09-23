import { useEffect, useState } from 'react';
import { getInitials } from '../../utils/formatters';

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-28 w-28 text-3xl',
};

/** Foto redonda; si no hay foto (o falla la carga) muestra las iniciales. */
export default function Avatar({ src, nombre, apellido, size = 'md', className = '' }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-900/10 font-semibold text-brand-500 ${SIZES[size]} ${className}`}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={`Fotografía de ${nombre} ${apellido || ''}`.trim()}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        getInitials(nombre, apellido) || '?'
      )}
    </div>
  );
}
