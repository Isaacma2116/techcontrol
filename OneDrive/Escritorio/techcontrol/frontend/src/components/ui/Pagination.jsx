import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, total, limit, onChange }) {
  if (total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const btn =
    'inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-slate-500">
        Mostrando <span className="font-medium text-slate-700">{from}–{to}</span> de{' '}
        <span className="font-medium text-slate-700">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <button className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft size={16} /> Anterior
        </button>
        <span className="px-1 text-sm text-slate-500">
          {page} / {totalPages}
        </span>
        <button className={btn} disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Siguiente <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
