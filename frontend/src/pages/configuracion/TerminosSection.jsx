import { useEffect, useState } from 'react';
import { Download, ScrollText } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { terminosService } from '../../services/terminosService';
import { formatDate } from '../../utils/formatters';
import SectionShell, { LoadError } from './SectionShell.jsx';

export default function TerminosSection() {
  const toast = useToast();
  const [datos, setDatos] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [descargando, setDescargando] = useState(false);

  const cargar = () => {
    setLoadError('');
    terminosService.get().then((res) => setDatos(res.data)).catch((err) => setLoadError(err.message));
  };
  useEffect(cargar, []);

  const descargar = async () => {
    setDescargando(true);
    try {
      await terminosService.descargarPdf();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDescargando(false);
    }
  };

  if (loadError) return <LoadError message={loadError} onRetry={cargar} />;
  if (!datos) return <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white" />;

  return (
    <SectionShell
      icon={ScrollText}
      title="Términos y condiciones"
      description={`Versión ${datos.version} · Actualizado el ${formatDate(datos.actualizado_el)}`}
      action={<Button variant="secondary" icon={Download} loading={descargando} onClick={descargar}>Descargar PDF</Button>}
    >
      <div className="space-y-5 p-5">
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
          Documento de referencia: revísalo con el área legal antes de considerarlo vigente.
        </div>
        {datos.secciones.map((s) => (
          <div key={s.titulo}>
            <h4 className="mb-1 text-sm font-semibold text-slate-800">{s.titulo}</h4>
            <p className="text-sm leading-relaxed text-slate-600">{s.texto}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
