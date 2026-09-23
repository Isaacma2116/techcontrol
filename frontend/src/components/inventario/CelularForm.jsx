import { useMemo, useState } from 'react';
import InventarioFormShell from './InventarioFormShell.jsx';
import ImageUploader from './ImageUploader.jsx';
import HolderSection from './HolderSection.jsx';
import { saveInventario } from './saveInventario.js';
import FormSection from '../ui/FormSection.jsx';
import { Field, Input, Textarea } from '../ui/FormField.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useImageField } from '../../hooks/useImageField';
import { useHolder } from '../../hooks/useHolder';
import { celularService, imagenUrl } from '../../services/inventarioService';
import { todayISO } from '../../utils/formatters';

const CODE_REGEX = /^[A-Za-z0-9._-]+$/;
const PHONE_REGEX = /^[0-9+()\-\s.]{7,25}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FIELD_ORDER = [
  'codigo_inventario', 'marca', 'modelo', 'numero_serie', 'imei_1', 'imei_2', 'color',
  'sistema_operativo', 'almacenamiento', 'ram', 'numero_telefono', 'operador', 'correo_asociado',
  'componentes', 'fecha_compra', 'fecha_renovacion', 'garantia_vence', 'garantia_detalle',
  'observaciones', 'colaborador_id', 'fecha_asignacion',
];

function initialValues(c) {
  return {
    codigo_inventario: c?.codigo_inventario ?? '',
    marca: c?.marca ?? '',
    modelo: c?.modelo ?? '',
    numero_serie: c?.numero_serie ?? '',
    imei_1: c?.imei_1 ?? '',
    imei_2: c?.imei_2 ?? '',
    color: c?.color ?? '',
    sistema_operativo: c?.sistema_operativo ?? '',
    almacenamiento: c?.almacenamiento ?? '',
    ram: c?.ram ?? '',
    numero_telefono: c?.numero_telefono ?? '',
    operador: c?.operador ?? '',
    correo_asociado: c?.correo_asociado ?? '',
    componentes: (c?.componentes_adicionales ?? []).join('\n'),
    fecha_compra: c?.fecha_compra ?? '',
    fecha_renovacion: c?.fecha_renovacion ?? '',
    garantia_vence: c?.garantia_vence ?? '',
    garantia_detalle: c?.garantia_detalle ?? '',
    observaciones: c?.observaciones ?? '',
    fecha_asignacion: todayISO(),
    observaciones_asignacion: '',
  };
}

// IMEI: 15 digitos con digito verificador (Luhn).
function isValidImei(value) {
  const digits = value.replace(/[\s-]/g, '');
  if (!/^\d{15}$/.test(digits)) return false;
  const sum = [...digits].reverse().reduce((acc, ch, i) => {
    let n = Number(ch);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    return acc + n;
  }, 0);
  return sum % 10 === 0;
}

// Mismas reglas que el backend (que sigue siendo la validacion definitiva).
function validate(v) {
  const e = {};
  const code = v.codigo_inventario.trim();
  if (code && !CODE_REGEX.test(code)) e.codigo_inventario = 'Solo letras, números, puntos, guiones y guion bajo.';
  for (const f of ['imei_1', 'imei_2']) {
    if (v[f].trim() && !isValidImei(v[f].trim())) e[f] = 'El IMEI debe tener 15 dígitos válidos.';
  }
  if (!e.imei_2 && v.imei_2.trim() && v.imei_2.replace(/[\s-]/g, '') === v.imei_1.replace(/[\s-]/g, '')) {
    e.imei_2 = 'El IMEI 2 no puede ser igual al IMEI 1.';
  }
  if (v.numero_telefono.trim() && !PHONE_REGEX.test(v.numero_telefono.trim())) {
    e.numero_telefono = 'Ingresa un número de teléfono válido (7 a 25 dígitos).';
  }
  if (v.correo_asociado.trim() && !EMAIL_REGEX.test(v.correo_asociado.trim())) {
    e.correo_asociado = 'Ingresa un correo válido.';
  }
  const lines = v.componentes.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length > 20) e.componentes = 'Máximo 20 componentes.';
  return e;
}

/**
 * Formulario modal de Celular (crear: celular = null; editar: detalle del celular).
 * Un celular puede existir sin colaborador; su responsable se registra como una
 * asignacion con historial. No se guardan PIN ni contrasenas: usa un MDM o un
 * gestor de contrasenas.
 */
export default function CelularForm({ celular, onClose, onSaved }) {
  const isEdit = !!celular;
  const toast = useToast();

  const initial = useMemo(() => initialValues(celular), [celular]);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const { holder, setHolder, initialHolder, holderChanged, canChangeHolder } = useHolder(celular);
  const image = useImageField(imagenUrl('celulares', celular?.imagen));

  const dirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(initial) || holderChanged || image.dirty,
    [values, initial, holderChanged, image.dirty]
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

    const { componentes, ...rest } = values;
    const payload = {
      ...rest,
      componentes_adicionales: componentes.split('\n').map((l) => l.trim()).filter(Boolean),
    };
    if (canChangeHolder) payload.colaborador_id = holder?.id ?? ''; // '' = sin asignar
    if (!holderChanged || !holder) {
      delete payload.fecha_asignacion;
      delete payload.observaciones_asignacion;
    }

    setSaving(true);
    try {
      const { item, imageFailure } = await saveInventario({
        service: celularService,
        id: celular?.id,
        payload,
        image,
        hadImage: !!celular?.imagen,
      });
      toast.success(isEdit ? 'Celular actualizado correctamente.' : 'Celular creado correctamente.');
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
      title={isEdit ? 'Editar celular' : 'Nuevo celular'}
      subtitle={isEdit ? `${celular.codigo_inventario} · ${celular.titulo || celular.tipo}` : 'Registra un celular en el inventario.'}
      formId="celular-form"
      submitLabel={isEdit ? 'Guardar cambios' : 'Crear celular'}
      saving={saving}
      dirty={dirty}
      formError={formError}
      onClose={onClose}
    >
      <form id="celular-form" onSubmit={handleSubmit} noValidate>
        <FormSection title="Información general">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[9rem_1fr]">
            <ImageUploader kind="celulares" field={image} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Código de inventario"
                htmlFor="f-codigo_inventario"
                error={errors.codigo_inventario}
                hint={isEdit ? undefined : 'Déjalo vacío para generarlo (CEL-00015).'}
                className="sm:col-span-2"
              >
                <Input {...bind('codigo_inventario')} maxLength={60} placeholder={isEdit ? '' : 'Automático'} />
              </Field>
              <Field label="Marca" htmlFor="f-marca" error={errors.marca}>
                <Input {...bind('marca')} maxLength={80} />
              </Field>
              <Field label="Modelo" htmlFor="f-modelo" error={errors.modelo}>
                <Input {...bind('modelo')} maxLength={120} />
              </Field>
              <Field label="Número de serie" htmlFor="f-numero_serie" error={errors.numero_serie}>
                <Input {...bind('numero_serie')} maxLength={120} />
              </Field>
              <Field label="Color" htmlFor="f-color" error={errors.color}>
                <Input {...bind('color')} maxLength={40} />
              </Field>
              <Field label="IMEI 1" htmlFor="f-imei_1" error={errors.imei_1}>
                <Input {...bind('imei_1')} inputMode="numeric" maxLength={19} placeholder="15 dígitos" />
              </Field>
              <Field label="IMEI 2" htmlFor="f-imei_2" error={errors.imei_2} hint="Solo en equipos con doble SIM.">
                <Input {...bind('imei_2')} inputMode="numeric" maxLength={19} placeholder="15 dígitos" />
              </Field>
            </div>
          </div>
        </FormSection>

        <FormSection title="Características">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Sistema operativo" htmlFor="f-sistema_operativo" error={errors.sistema_operativo}>
              <Input {...bind('sistema_operativo')} maxLength={80} placeholder="Ej. Android 14" />
            </Field>
            <Field label="Almacenamiento" htmlFor="f-almacenamiento" error={errors.almacenamiento}>
              <Input {...bind('almacenamiento')} maxLength={60} placeholder="Ej. 128 GB" />
            </Field>
            <Field label="RAM" htmlFor="f-ram" error={errors.ram}>
              <Input {...bind('ram')} maxLength={60} placeholder="Ej. 8 GB" />
            </Field>
            <Field
              label="Componentes adicionales"
              htmlFor="f-componentes"
              error={errors.componentes}
              hint="Uno por línea (cargador, funda, protector…)."
              className="sm:col-span-3"
            >
              <Textarea {...bind('componentes')} rows={3} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Línea telefónica">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Número de teléfono" htmlFor="f-numero_telefono" error={errors.numero_telefono}>
              <Input {...bind('numero_telefono')} type="tel" maxLength={25} />
            </Field>
            <Field label="Operador" htmlFor="f-operador" error={errors.operador}>
              <Input {...bind('operador')} maxLength={60} />
            </Field>
            <Field
              label="Cuenta asociada (correo)"
              htmlFor="f-correo_asociado"
              error={errors.correo_asociado}
              hint="Solo el correo, para identificar la cuenta. No se guardan contraseñas ni PIN: usa un gestor de contraseñas o un MDM."
              className="sm:col-span-2"
            >
              <Input {...bind('correo_asociado')} type="email" maxLength={190} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Compra, renovación y garantía">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Fecha de compra" htmlFor="f-fecha_compra" error={errors.fecha_compra}>
              <Input {...bind('fecha_compra')} type="date" />
            </Field>
            <Field label="Fecha de renovación" htmlFor="f-fecha_renovacion" error={errors.fecha_renovacion}>
              <Input {...bind('fecha_renovacion')} type="date" />
            </Field>
            <Field label="Garantía vigente hasta" htmlFor="f-garantia_vence" error={errors.garantia_vence}>
              <Input {...bind('garantia_vence')} type="date" />
            </Field>
            <Field label="Detalle de garantía" htmlFor="f-garantia_detalle" error={errors.garantia_detalle}>
              <Input {...bind('garantia_detalle')} maxLength={120} placeholder="Proveedor, tipo de cobertura…" />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Observaciones">
          <Field label="Observaciones" htmlFor="f-observaciones" error={errors.observaciones}>
            <Textarea {...bind('observaciones')} rows={3} />
          </Field>
        </FormSection>

        <HolderSection
          kind="celulares"
          isEdit={isEdit}
          holder={holder}
          holderChanged={holderChanged}
          initialHolder={initialHolder}
          canChangeHolder={canChangeHolder}
          onHolderChange={setHolder}
          errors={errors}
          bind={bind}
        />
      </form>
    </InventarioFormShell>
  );
}
