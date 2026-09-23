import { Construction } from 'lucide-react';
import Badge from '../../components/ui/Badge.jsx';

/** Seccion de Configuracion que llega en una fase posterior: explica que incluira. */
export default function ProximamenteSection({ seccion }) {
  const Icon = seccion.icon || Construction;
  return (
    <section className={`rounded-xl border bg-white shadow-sm ${seccion.danger ? 'border-red-200' : 'border-slate-200'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${seccion.danger ? 'bg-red-50 text-red-600' : 'bg-brand-900/5 text-brand-500'}`}><Icon size={18} /></div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">{seccion.titulo}</h3>
            <p className="text-xs text-slate-500">{seccion.descripcion}</p>
          </div>
        </div>
        <Badge tone="amber">Próximamente</Badge>
      </div>
      <div className="p-5">
        <p className="mb-3 text-sm text-slate-600">Esta sección se habilitará en una próxima etapa. Incluirá:</p>
        <ul className="space-y-2">
          {seccion.incluye.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" /> {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
