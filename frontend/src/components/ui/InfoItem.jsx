/** Dato de solo lectura (etiqueta pequeña + valor). `href` lo vuelve enlace; vacio muestra "—". */
export function InfoItem({ label, children, href, wide = false }) {
  const empty = children === null || children === undefined || children === '';
  return (
    <div className={`min-w-0 ${wide ? 'sm:col-span-2' : ''}`}>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 break-words text-sm text-slate-800">
        {empty ? (
          <span className="text-slate-400">—</span>
        ) : href ? (
          <a href={href} className="text-brand-500 hover:underline">{children}</a>
        ) : (
          children
        )}
      </dd>
    </div>
  );
}

/** Grupo titulado de InfoItem en cuadricula. */
export function InfoGroup({ title, children }) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-slate-800">{title}</h3>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">{children}</dl>
    </div>
  );
}
