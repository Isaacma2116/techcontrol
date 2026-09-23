import { FileSignature, Save } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import { Field, Input, Select, Textarea } from '../../components/ui/FormField.jsx';
import SectionShell, { FormAlert, LoadError, SectionSkeleton } from './SectionShell.jsx';
import { useEmpresaForm } from './useEmpresaForm.js';

const FIELDS = [
  'encabezado_documento', 'pie_documento', 'formato_fecha',
  'entrega_nombre', 'entrega_cargo', 'folio_prefijo', 'texto_declaracion', 'texto_condiciones',
];

const EJEMPLO_FECHA = { larga: '21 de septiembre de 2026', corta: '21/09/2026' };

/** Documentos (solo administradores): formato y textos que usan las cartas responsivas. */
export default function DocumentosSection() {
  const form = useEmpresaForm(FIELDS, 'Configuración de documentos actualizada.');
  const { empresa, values, errors, bind } = form;

  if (form.loadError) return <LoadError message={form.loadError} onRetry={form.reload} />;
  if (!empresa) return <SectionSkeleton />;

  const handleSubmit = (e) => {
    e.preventDefault();
    form.save((v) => (/^[A-Za-z0-9]{1,10}$/.test(v.folio_prefijo.trim()) ? {} : { folio_prefijo: 'El prefijo admite de 1 a 10 letras o números.' }));
  };

  return (
    <SectionShell
      icon={FileSignature}
      title="Documentos"
      description="Formato y textos de las cartas responsivas. El nombre y el logo de la empresa se editan en la sección Empresa."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-6 p-5">
        <FormAlert>{form.formError}</FormAlert>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-slate-800">Formato</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Encabezado del documento" htmlFor="e-encabezado_documento" error={errors.encabezado_documento} hint="Aparece bajo el nombre de la empresa. Ej. Departamento de Tecnologías de la Información.">
              <Input {...bind('encabezado_documento')} maxLength={255} />
            </Field>
            <Field label="Pie de página" htmlFor="e-pie_documento" error={errors.pie_documento} hint="Aparece al pie de cada hoja, junto al folio y la página.">
              <Input {...bind('pie_documento')} maxLength={255} placeholder="Documento confidencial de uso interno" />
            </Field>
            <Field label="Formato de fecha" htmlFor="e-formato_fecha" error={errors.formato_fecha} hint={`Ejemplo: ${EJEMPLO_FECHA[values.formato_fecha] || EJEMPLO_FECHA.larga}`}>
              <Select {...bind('formato_fecha')}>
                <option value="larga">Larga (21 de septiembre de 2026)</option>
                <option value="corta">Corta (21/09/2026)</option>
              </Select>
            </Field>
            <Field label="Prefijo del folio" htmlFor="e-folio_prefijo" error={errors.folio_prefijo} hint={`Ejemplo: ${values.folio_prefijo || 'CR'}-${new Date().getFullYear()}-000001`}>
              <Input {...bind('folio_prefijo')} maxLength={10} />
            </Field>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <h4 className="mb-1 text-sm font-semibold text-slate-800">Responsable de TI</h4>
          <p className="mb-4 text-xs text-slate-500">Quien normalmente entrega los equipos. Se propone al crear cada carta (se puede cambiar en cada una).</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nombre" htmlFor="e-entrega_nombre" error={errors.entrega_nombre}>
              <Input {...bind('entrega_nombre')} maxLength={150} />
            </Field>
            <Field label="Cargo" htmlFor="e-entrega_cargo" error={errors.entrega_cargo}>
              <Input {...bind('entrega_cargo')} maxLength={150} />
            </Field>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <h4 className="mb-1 text-sm font-semibold text-slate-800">Textos de la carta responsiva</h4>
          <p className="mb-4 text-xs text-slate-500">Son borradores de referencia: deben ser revisados por el área legal de tu empresa antes de usarse.</p>
          <div className="grid grid-cols-1 gap-4">
            <Field label="Declaración de recepción" htmlFor="e-texto_declaracion" error={errors.texto_declaracion} hint="Usa {colaborador} y {empresa} para insertar sus nombres.">
              <Textarea {...bind('texto_declaracion')} rows={6} maxLength={5000} />
            </Field>
            <Field label="Condiciones de uso y cuidado" htmlFor="e-texto_condiciones" error={errors.texto_condiciones} hint="Una condición por línea; se numeran automáticamente.">
              <Textarea {...bind('texto_condiciones')} rows={8} maxLength={5000} />
            </Field>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-100 pt-4">
          <Button type="submit" icon={Save} loading={form.saving} disabled={!form.dirty}>Guardar cambios</Button>
        </div>
      </form>
    </SectionShell>
  );
}
