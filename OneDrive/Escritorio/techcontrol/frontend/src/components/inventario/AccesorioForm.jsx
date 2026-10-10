import { useEffect, useMemo, useState } from 'react';
import InventarioFormShell from './InventarioFormShell.jsx';
import ImageUploader from './ImageUploader.jsx';
import { saveInventario } from './saveInventario.js';
import CatalogSelect from '../colaboradores/CatalogSelect.jsx';
import FormSection from '../ui/FormSection.jsx';
import { Field, Input, Textarea } from '../ui/FormField.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useImageField } from '../../hooks/useImageField';
import { catalogoService } from '../../services/colaboradorService';
import { accesorioService, imagenUrl } from '../../services/inventarioService';

const CODE_REGEX = /^[A-Za-z0-9._-]+$/;

const FIELD_ORDER = [
  'codigo_inventario', 'tipo_accesorio_id', 'nombre', 'marca', 'modelo', 'numero_serie',
  'fecha_compra', 'garantia_vence', 'observaciones',
];

function initialValues(a) {
  return {
    codigo_inventario: a?.codigo_inventario ?? '',
    tipo_accesorio_id: a ? String(a.tipo_id) : '',
    nombre: a?.nombre ?? '',
    marca: a?.marca ?? '',
    modelo: a?.modelo ?? '',
    numero_serie: a?.numero_serie ?? '',
    fecha_compra: a?.fecha_compra ?? '',
    garantia_vence: a?.garantia_vence ?? '',
    observaciones: a?.observaciones ?? '',
  };
}

// Mismas reglas que el backend (que sigue siendo la validacion definitiva).
function validate(v) {
  const e = {};
  const code = v.codigo_inventario.trim();
  if (code && !CODE_REGEX.test(code)) e.codigo_inventario = 'Solo letras, números, puntos, guiones y guion bajo.';
  if (!v.tipo_accesorio_id) e.tipo_accesorio_id = 'Selecciona el tipo de accesorio.';
  if (!v.nombre.trim()) e.nombre = 'El nombre es obligatorio.';
  return e;
}

/** Formulario modal de Accesorio (crear: accesorio = null; editar: detalle del accesorio). */
export default function AccesorioForm({ accesorio, onClose, onSaved }) {
  const isEdit = !!accesorio;
  const toast = useToast();

  const initial = useMemo(() => initialValues(accesorio), [accesorio]);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const image = useImageField(imagenUrl('accesorios', accesorio?.imagen));

  const [tipos, setTipos] = useState([]);
  const [catalogError, setCatalogError] = useState('');
  useEffect(() => {
    let cancelled = false;
    catalogoService
      .list('tipos-accesorio')
      .then((res) => !cancelled && setTipos(res.data.items))
      .catch((err) => !cancelled && setCatalogError(err.message));
    return () => { cancelled = true; };
  }, []);

  const dirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(initial) || image.dirty,
    [values, initial, image.dirty]
  );

  const set = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };
  const bind = (name) => ({
    id: `f-${name}`,
    value: values[name],
    error: errors[name],
    onChange: (e) => set(name, e.target.value),
  });

  const focusFirstError = (errs) => {
    const first = FIELD_ORDER.find((f) => errs[f]);
    if (first) document.getElementById(`f-${first}`)?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const clientErrors = validate(values);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) return focusFirstError(clientErrors);

    setSaving(true);
    try {
      const { item, imageFailure } = await saveInventario({
        service: accesorioService,
        id: accesorio?.id,
        payload: { ...values, tipo_accesorio_id: Number(values.tipo_accesorio_id) },
        image,
        hadImage: !!accesorio?.imagen,
      });
      toast.success(isEdit ? 'Accesorio actualizado correctamente.' : 'Accesorio creado correctamente.');
      if (imageFailure) toast.error(`Los datos se guardaron, pero la imagen no: ${imageFailure}`);
      onSaved(item);
    } catch (err) {
      if (err.errors) {
        setErrors(err.errors);
        focusFirstError(err.errors);
      }
      setFormError(err.message);
      setSaving(false);
    }
  };

  return (
    <InventarioFormShell
      title={isEdit ? 'Editar accesorio' : 'Nuevo accesorio'}
      subtitle={isEdit ? `${accesorio.codigo_inventario} · ${accesorio.nombre}` : 'Registra un accesorio o periférico.'}
      formId="accesorio-form"
      submitLabel={isEdit ? 'Guardar cambios' : 'Crear accesorio'}
      saving={saving}
      dirty={dirty}
      formError={formError || (catalogError && `No se pudieron cargar los tipos: ${catalogError}`)}
      onClose={onClose}
    >
      <form id="accesorio-form" onSubmit={handleSubmit} noValidate>
        <FormSection title="Información general">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[9rem_1fr]">
            <ImageUploader kind="accesorios" field={image} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Código de inventario"
                htmlFor="f-codigo_inventario"
                error={errors.codigo_inventario}
                hint={isEdit ? undefined : 'Déjalo vacío para generarlo (ACC-00025).'}
              >
                <Input {...bind('codigo_inventario')} maxLength={60} placeholder={isEdit ? '' : 'Automático'} />
              </Field>
              <Field label="Tipo" htmlFor="f-tipo_accesorio_id" required error={errors.tipo_accesorio_id}>
                <CatalogSelect
                  id="f-tipo_accesorio_id"
                  tipo="tipos-accesorio"
                  singular="tipo"
                  items={tipos}
                  value={values.tipo_accesorio_id}
                  error={errors.tipo_accesorio_id}
                  onChange={(v) => set('tipo_accesorio_id', v)}
                  onCreated={(item) => {
                    setTipos((list) => [...list, item].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')));
                    set('tipo_accesorio_id', String(item.id));
                  }}
                />
              </Field>
              <Field label="Nombre" htmlFor="f-nombre" required error={errors.nombre} className="sm:col-span-2">
                <Input {...bind('nombre')} maxLength={150} placeholder="Ej. Mouse Logitech M185" />
              </Field>
              <Field label="Marca" htmlFor="f-marca" error={errors.marca}>
                <Input {...bind('marca')} maxLength={80} />
              </Field>
              <Field label="Modelo" htmlFor="f-modelo" error={errors.modelo}>
                <Input {...bind('modelo')} maxLength={120} />
              </Field>
              <Field
                label="Número de serie"
                htmlFor="f-numero_serie"
                error={errors.numero_serie}
                hint="Opcional: muchos accesorios no tienen. El código de inventario los identifica."
                className="sm:col-span-2"
              >
                <Input {...bind('numero_serie')} maxLength={120} />
              </Field>
            </div>
          </div>
        </FormSection>

        <FormSection title="Compra y garantía">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Fecha de compra" htmlFor="f-fecha_compra" error={errors.fecha_compra}>
              <Input {...bind('fecha_compra')} type="date" />
            </Field>
            <Field label="Garantía vigente hasta" htmlFor="f-garantia_vence" error={errors.garantia_vence}>
              <Input {...bind('garantia_vence')} type="date" />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Observaciones">
          <Field label="Observaciones" htmlFor="f-observaciones" error={errors.observaciones}>
            <Textarea {...bind('observaciones')} rows={3} />
          </Field>
        </FormSection>
      </form>
    </InventarioFormShell>
  );
}
