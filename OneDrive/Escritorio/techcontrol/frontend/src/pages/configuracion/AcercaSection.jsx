import { Info, Layers } from 'lucide-react';
import { InfoItem } from '../../components/ui/InfoItem.jsx';
import SectionShell from './SectionShell.jsx';

const TECNOLOGIAS = {
  Frontend: ['React 18', 'React Router', 'Vite', 'Tailwind CSS'],
  Backend: ['Node.js', 'Express', 'MySQL'],
};

/** Informacion estatica del sistema: nada de esto sale de la base de datos. */
export default function AcercaSection() {
  return (
    <div className="space-y-6">
      <SectionShell icon={Info} title="Acerca de TechControl">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 p-5 sm:grid-cols-2">
          <InfoItem label="Sistema">TechControl — Gestión de Activos TI</InfoItem>
          <InfoItem label="Versión">1.0 · Etapa 1</InfoItem>
          <InfoItem label="Desarrollo">Equipo interno de TI</InfoItem>
          <InfoItem label="Soporte">Contacta al administrador del sistema en tu empresa.</InfoItem>
        </dl>
      </SectionShell>

      <SectionShell icon={Layers} title="Tecnologías utilizadas">
        <div className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-2">
          {Object.entries(TECNOLOGIAS).map(([grupo, items]) => (
            <div key={grupo}>
              <h4 className="mb-2 text-sm font-semibold text-slate-800">{grupo}</h4>
              <div className="flex flex-wrap gap-1.5">
                {items.map((t) => (
                  <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionShell>
    </div>
  );
}
