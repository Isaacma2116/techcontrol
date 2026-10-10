import { Link } from 'react-router-dom';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const NIVEL = {
  critico: { icon: AlertCircle, className: 'text-red-500' },
  advertencia: { icon: AlertTriangle, className: 'text-amber-500' },
  info: { icon: Info, className: 'text-sky-500' },
};

/**
 * Alertas y pendientes: cada fila es clicable y lleva al modulo correspondiente
 * ya filtrado (o a la seccion del propio dashboard, para lo que no tiene un
 * modulo filtrable todavia, como Garantias).
 */
export default function AlertasList({ alertas }) {
  if (!alertas.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <CheckCircle2 className="text-emerald-500" size={28} />
        <p className="text-sm text-slate-500">Sin pendientes por ahora. Todo en orden.</p>
      </div>
    );
  }

  const rowClass = 'flex w-full items-center gap-3 rounded-lg px-1 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50';

  return (
    <ul className="divide-y divide-slate-100">
      {alertas.map((a) => {
        const { icon: Icon, className } = NIVEL[a.nivel] || NIVEL.info;
        const esAncla = a.href.startsWith('#');
        const contenido = (
          <>
            <Icon size={17} className={`shrink-0 ${className}`} />
            <span className="flex-1">{a.texto}</span>
            <span className="text-xs text-slate-400">Ver →</span>
          </>
        );
        return (
          <li key={a.id}>
            {esAncla ? (
              // Ancla dentro del propio Dashboard (p. ej. Garantías, que aun no tiene modulo propio):
              // se navega con JS para que SIEMPRE haga scroll, incluso si ya estamos en /dashboard.
              <button
                type="button"
                className={rowClass}
                onClick={() => document.getElementById(a.href.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                {contenido}
              </button>
            ) : (
              <Link to={a.href} className={rowClass}>{contenido}</Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
