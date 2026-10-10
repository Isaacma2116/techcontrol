import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// Pila de modales abiertos: con uno encima de otro (p. ej. confirmacion sobre
// el formulario), Escape cierra solo el de arriba.
const stack = [];

const SIZES = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };

/**
 * Ventana modal accesible: cierra con Escape o clic en el fondo, bloquea
 * el desplazamiento de la pagina y tiene cabecera/pie fijos con cuerpo con scroll.
 */
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  size = 'lg',
  footer,
  children,
  layer = 'z-50',
}) {
  const panelRef = useRef(null);
  const idRef = useRef(Symbol('modal'));
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const id = idRef.current;
    stack.push(id);

    const onKey = (e) => {
      if (e.key === 'Escape' && stack[stack.length - 1] === id) onCloseRef.current?.();
    };
    document.addEventListener('keydown', onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const previousFocus = document.activeElement;
    panelRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      stack.splice(stack.indexOf(id), 1);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${layer} flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`flex max-h-[95vh] w-full ${SIZES[size]} flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl outline-none sm:max-h-[90vh] sm:rounded-2xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-slate-800 sm:text-lg">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-2 shrink-0 rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="table-scroll flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          {children}
        </div>

        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
