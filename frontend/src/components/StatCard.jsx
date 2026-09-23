export default function StatCard({ label, value, icon: Icon, tone = 'default', onClick, active = false }) {
  const tones = {
    default: 'bg-brand-900/5 text-brand-500',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-sky-50 text-sky-600',
    red: 'bg-red-50 text-red-600',
  };

  const content = (
    <>
      {Icon && (
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon size={20} />
        </div>
      )}
      <div>
        <p className="text-2xl font-bold leading-tight text-slate-800">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </>
  );

  const base = 'flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm';

  // Sin onClick es una tarjeta informativa (uso original); con onClick, un boton de filtro.
  if (!onClick) {
    return <div className={`${base} border-slate-200`}>{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${base} w-full text-left transition-colors hover:border-brand-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40
        ${active ? 'border-brand-500 ring-1 ring-brand-500/30' : 'border-slate-200'}`}
    >
      {content}
    </button>
  );
}
