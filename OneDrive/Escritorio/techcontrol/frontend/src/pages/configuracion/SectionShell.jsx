import { AlertCircle, RotateCcw } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';

/** Tarjeta de una seccion de Configuracion: icono + titulo + descripcion, y el contenido. */
export default function SectionShell({ icon: Icon, title, description, action, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-900/5 text-brand-500"><Icon size={18} /></div>
          )}
          <div>
            <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
            {description && <p className="text-xs text-slate-500">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function FormAlert({ children }) {
  if (!children) return null;
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
      <AlertCircle size={16} className="mt-0.5 shrink-0" /> <span>{children}</span>
    </div>
  );
}

export function LoadError({ message, onRetry }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center">
      <AlertCircle className="mx-auto mb-2 text-red-500" size={28} />
      <p className="text-sm text-red-700">No se pudo cargar la información: {message}</p>
      <div className="mt-4"><Button variant="secondary" icon={RotateCcw} onClick={onRetry}>Reintentar</Button></div>
    </div>
  );
}

export const SectionSkeleton = () => <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white" />;
