import { useRef, useState } from 'react';
import { AlertTriangle, Download, FileSpreadsheet, Upload } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import VerificarPasswordModal from '../../components/ui/VerificarPasswordModal.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { datosService } from '../../services/datosService';
import { colaboradorService } from '../../services/colaboradorService';
import SectionShell from './SectionShell.jsx';

/**
 * Datos y respaldos (solo admin). "Respaldo" aqui es un Excel exportable de
 * todo el inventario y los catalogos principales: no hay mysqldump ni
 * respaldos automaticos (no es seguro invocar el shell del servidor desde
 * una peticion HTTP en esta arquitectura). Importar esta acotado a
 * Colaboradores por ahora; sienta el patron para extenderlo despues.
 */
export default function DatosSection() {
  const toast = useToast();
  const [exportando, setExportando] = useState(false);
  const [descargandoPlantilla, setDescargandoPlantilla] = useState(false);
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [pedirPassword, setPedirPassword] = useState(null); // 'exportar' | 'importar' | null
  const fileRef = useRef(null);

  const exportar = async () => {
    setExportando(true);
    try {
      await datosService.exportar();
      toast.success('Descarga iniciada.');
    } catch (err) {
      if (err.code === 'REAUTH_REQUIRED') setPedirPassword('exportar');
      else toast.error(err.message);
    } finally {
      setExportando(false);
    }
  };

  const descargarPlantilla = async () => {
    setDescargandoPlantilla(true);
    try {
      await colaboradorService.descargarPlantillaImportacion();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDescargandoPlantilla(false);
    }
  };

  const importar = async (archivo) => {
    if (!archivo) return;
    setImportando(true);
    setResultado(null);
    try {
      const res = await colaboradorService.importar(archivo);
      setResultado(res.data);
      toast.success(res.message);
    } catch (err) {
      if (err.code === 'REAUTH_REQUIRED') setPedirPassword('importar');
      else toast.error(err.message);
    } finally {
      setImportando(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <SectionShell
        icon={FileSpreadsheet}
        title="Exportar información"
        description="Descarga un Excel con equipos, accesorios, impresoras, celulares, colaboradores y licencias — un respaldo manual de los datos."
      >
        <div className="flex justify-end p-5">
          <Button icon={Download} loading={exportando} onClick={exportar}>Exportar todo (Excel)</Button>
        </div>
      </SectionShell>

      <SectionShell
        icon={Upload}
        title="Importar colaboradores"
        description="Alta masiva desde un archivo Excel. Descarga la plantilla, complétala y súbela; cada fila se valida por separado."
      >
        <div className="space-y-4 p-5">
          <Button variant="secondary" icon={Download} loading={descargandoPlantilla} onClick={descargarPlantilla}>
            Descargar plantilla
          </Button>

          <div>
            <label htmlFor="archivo-importar" className="mb-1.5 block text-sm font-medium text-slate-700">Archivo (.xlsx)</label>
            <input
              id="archivo-importar"
              ref={fileRef}
              type="file"
              accept=".xlsx"
              disabled={importando}
              onChange={(e) => importar(e.target.files?.[0])}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-oncolor hover:file:bg-brand-800"
            />
          </div>

          {importando && <p className="text-sm text-slate-500">Importando, un momento…</p>}

          {resultado && (
            <div className="space-y-2 rounded-lg border border-slate-200 p-4">
              <p className="text-sm text-slate-700">
                <Badge tone="green">{resultado.creados} creado(s)</Badge>{' '}
                {resultado.errores.length > 0 && <Badge tone="red">{resultado.errores.length} con error</Badge>}{' '}
                <span className="text-slate-500">de {resultado.total} fila(s)</span>
              </p>
              {resultado.errores.length > 0 && (
                <ul className="max-h-48 space-y-1 overflow-y-auto text-xs text-slate-600">
                  {resultado.errores.map((e, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-500" />
                      Fila {e.fila}: {e.mensaje}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </SectionShell>

      {pedirPassword && (
        <VerificarPasswordModal
          onClose={() => setPedirPassword(null)}
          onVerificado={() => {
            const accion = pedirPassword;
            setPedirPassword(null);
            if (accion === 'exportar') exportar();
            else if (fileRef.current?.files?.[0]) importar(fileRef.current.files[0]);
          }}
        />
      )}
    </div>
  );
}
