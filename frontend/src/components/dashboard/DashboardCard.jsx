/** Tarjeta contenedora de una seccion del Dashboard: mismo estilo que las de Reportes. */
export default function DashboardCard({ title, description, action, children, id, className = '' }) {
  return (
    <section id={id} className={`scroll-mt-20 rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
