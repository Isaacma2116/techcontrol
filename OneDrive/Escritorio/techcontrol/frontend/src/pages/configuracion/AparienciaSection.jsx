import { useState } from 'react';
import { Check, Laptop, LayoutList, Moon, Rows3, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../context/ToastContext.jsx';
import { perfilService } from '../../services/perfilService';
import SectionShell from './SectionShell.jsx';

const TEMAS = [
  { id: 'claro', label: 'Claro', icon: Sun },
  { id: 'oscuro', label: 'Oscuro', icon: Moon },
  { id: 'automatico', label: 'Automático', icon: Laptop },
];

// El color del swatch es el mismo hex que --color-brand-500 de ese acento en index.css.
const ACENTOS = [
  { id: 'azul', label: 'Azul', clase: 'bg-[#2563EB]' },
  { id: 'verde', label: 'Verde', clase: 'bg-[#059669]' },
  { id: 'morado', label: 'Morado', clase: 'bg-[#7C3AED]' },
  { id: 'naranja', label: 'Naranja', clase: 'bg-[#EA580C]' },
  { id: 'rojo', label: 'Rojo', clase: 'bg-[#E11D48]' },
  { id: 'rosa', label: 'Rosa', clase: 'bg-[#DB2777]' },
  { id: 'indigo', label: 'Índigo', clase: 'bg-[#4F46E5]' },
  { id: 'cian', label: 'Cian', clase: 'bg-[#0D9488]' },
];

const DENSIDADES = [
  { id: 'comoda', label: 'Cómoda', icon: Rows3, descripcion: 'Más espacio entre filas.' },
  { id: 'compacta', label: 'Compacta', icon: LayoutList, descripcion: 'Más filas visibles a la vez.' },
];

/** Apariencia: tema, color de acento y densidad. Se aplica al instante y se guarda en el servidor. */
export default function AparienciaSection() {
  const { tema, acento, densidad, setPreferencias } = useTheme();
  const toast = useToast();
  const [guardando, setGuardando] = useState(null); // que campo se esta guardando ahora

  const aplicar = async (campo, valor) => {
    setPreferencias({ [campo]: valor }); // instantaneo, no espera al servidor
    setGuardando(campo);
    try {
      await perfilService.updatePreferencias({ [campo]: valor });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuardando(null);
    }
  };

  return (
    <div className="space-y-6">
      <SectionShell icon={Sun} title="Tema" description="Elige cómo se ve TechControl en este dispositivo.">
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-3">
          {TEMAS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => aplicar('tema', id)}
              aria-pressed={tema === id}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors
                ${tema === id ? 'border-brand-500 bg-brand-900/5 text-brand-500' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <Icon size={20} />
              {label}
              {tema === id && <Check size={14} className="text-brand-500" />}
            </button>
          ))}
        </div>
      </SectionShell>

      <SectionShell title="Color de acento" description="Color principal de botones, enlaces y del menú lateral.">
        <div className="flex flex-wrap gap-4 p-5">
          {ACENTOS.map(({ id, label, clase }) => (
            <button
              key={id}
              type="button"
              onClick={() => aplicar('acento', id)}
              aria-pressed={acento === id}
              aria-label={label}
              title={label}
              className="flex flex-col items-center gap-1.5"
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-full ${clase} ring-2 ring-offset-2 ${acento === id ? 'ring-slate-400' : 'ring-transparent'}`}>
                {acento === id && <Check size={16} className="text-oncolor" />}
              </span>
              <span className="text-xs text-slate-500">{label}</span>
            </button>
          ))}
        </div>
      </SectionShell>

      <SectionShell title="Densidad de las tablas" description="Cuánto espacio usa cada fila en los listados.">
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
          {DENSIDADES.map(({ id, label, icon: Icon, descripcion }) => (
            <button
              key={id}
              type="button"
              onClick={() => aplicar('densidad', id)}
              aria-pressed={densidad === id}
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors
                ${densidad === id ? 'border-brand-500 bg-brand-900/5' : 'border-slate-200 hover:bg-slate-50'}`}
            >
              <Icon size={18} className={densidad === id ? 'text-brand-500' : 'text-slate-400'} />
              <span>
                <span className="block text-sm font-medium text-slate-800">{label}</span>
                <span className="block text-xs text-slate-500">{descripcion}</span>
              </span>
            </button>
          ))}
        </div>
      </SectionShell>

      <p className="px-1 text-xs text-slate-400">{guardando ? 'Guardando…' : 'Los cambios se guardan automáticamente.'}</p>
    </div>
  );
}
