import { Construction } from 'lucide-react';

/**
 * Pagina generica para modulos aun no desarrollados
 * (Equipos, Monitores, Licencias, etc.). Permite navegar
 * la aplicacion completa desde ahora sin rutas rotas.
 */
export default function Placeholder({ title }) {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-900/5 text-brand-500">
        <Construction size={26} />
      </div>
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        Este módulo aún no está disponible. Se desarrollará en una etapa
        posterior del proyecto.
      </p>
    </div>
  );
}
