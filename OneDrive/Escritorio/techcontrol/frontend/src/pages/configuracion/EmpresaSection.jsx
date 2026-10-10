import { Building2, Save } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import { Field, Input, Textarea } from '../../components/ui/FormField.jsx';
import LogoUploader from '../../components/empresa/LogoUploader.jsx';
import SectionShell, { FormAlert, LoadError, SectionSkeleton } from './SectionShell.jsx';
import { useEmpresaForm } from './useEmpresaForm.js';

const FIELDS = ['nombre', 'descripcion', 'rfc', 'direccion', 'telefono', 'correo', 'sitio_web'];

/** Empresa (solo administradores): nombre, logo y datos corporativos que usan los documentos. */
export default function EmpresaSection() {
  const form = useEmpresaForm(FIELDS, 'Información de la empresa actualizada.');
  const { empresa, values, errors, bind } = form;

  if (form.loadError) return <LoadError message={form.loadError} onRetry={form.reload} />;
  if (!empresa) return <SectionSkeleton />;

  const handleSubmit = (e) => {
    e.preventDefault();
    form.save((v) => (v.nombre.trim() ? {} : { nombre: 'El nombre de la empresa es obligatorio.' }));
  };

  return (
    <SectionShell icon={Building2} title="Información de la empresa" description="Se usa automáticamente en las cartas responsivas y en los documentos que se generen.">
      <div className="grid gap-6 p-5 md:grid-cols-[13rem_1fr]">
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Logo</p>
          <LogoUploader empresa={empresa} onChanged={form.setEmpresa} />
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <FormAlert>{form.formError}</FormAlert>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nombre de la empresa" htmlFor="e-nombre" required error={errors.nombre} className="sm:col-span-2">
              <Input {...bind('nombre')} maxLength={150} />
            </Field>
            <Field label="Descripción" htmlFor="e-descripcion" error={errors.descripcion} className="sm:col-span-2" hint="Opcional. A qué se dedica la empresa.">
              <Textarea {...bind('descripcion')} rows={3} maxLength={500} />
            </Field>
            <Field label="RFC" htmlFor="e-rfc" error={errors.rfc} hint="Opcional">
              <Input {...bind('rfc')} maxLength={20} />
            </Field>
            <Field label="Teléfono" htmlFor="e-telefono" error={errors.telefono}>
              <Input {...bind('telefono')} type="tel" maxLength={25} />
            </Field>
            <Field label="Dirección" htmlFor="e-direccion" error={errors.direccion} className="sm:col-span-2">
              <Input {...bind('direccion')} maxLength={255} />
            </Field>
            <Field label="Correo" htmlFor="e-correo" error={errors.correo}>
              <Input {...bind('correo')} type="email" maxLength={190} />
            </Field>
            <Field label="Sitio web" htmlFor="e-sitio_web" error={errors.sitio_web} hint="Opcional">
              <Input {...bind('sitio_web')} maxLength={190} placeholder="www.miempresa.com" />
            </Field>
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-4">
            <Button type="submit" icon={Save} loading={form.saving} disabled={!form.dirty}>Guardar cambios</Button>
          </div>
        </form>
      </div>
    </SectionShell>
  );
}
