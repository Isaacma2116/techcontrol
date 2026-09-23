/** "7 de 10 usados · 3 disponibles", con una barra de progreso. */
export default function PuestosBar({ utilizadas, total, size = 'md' }) {
  const pct = total > 0 ? Math.min(100, Math.round((utilizadas / total) * 100)) : 0;
  const lleno = utilizadas >= total;
  const disponibles = Math.max(0, total - utilizadas);

  return (
    <div className={size === 'sm' ? 'w-32' : 'w-full max-w-xs'}>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700">{utilizadas} de {total} usados</span>
        <span className={disponibles === 0 ? 'text-amber-600' : 'text-slate-400'}>{disponibles} libres</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${lleno ? 'bg-amber-500' : 'bg-brand-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
