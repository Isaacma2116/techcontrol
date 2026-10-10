import { PackageOpen } from 'lucide-react';

/** Tarjeta con titulo (y contador / boton de accion opcionales) para secciones de un detalle. */
export function SectionCard({ title, description, count, action, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
        </div>
        <div className="flex items-center gap-3">
          {count !== undefined && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{count}</span>
          )}
          {action}
        </div>
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ icon: Icon = PackageOpen, message }) {
  return (
    <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
      <Icon size={28} className="text-slate-300" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}
