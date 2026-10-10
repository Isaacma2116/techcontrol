import { useEffect, useMemo, useState } from 'react';
import InventarioFormShell from './InventarioFormShell.jsx';
import ImageUploader from './ImageUploader.jsx';
import HolderSection from './HolderSection.jsx';
import { saveInventario } from './saveInventario.js';
import CatalogSelect from '../colaboradores/CatalogSelect.jsx';
import FormSection from '../ui/FormSection.jsx';
import { Field, Input, Select, Textarea } from '../ui/FormField.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useImageField } from '../../hooks/useImageField';
import { useHolder } from '../../hooks/useHolder';
import { catalogoService } from '../../services/colaboradorService';
import { impresoraService, imagenUrl } from '../../services/inventarioService';
import { TIPOS_CONEXION } from '../../utils/inventarioConfig';
import { todayISO } from '../../utils/formatters';

const CODE_REGEX = /^[A-Za-z0-9._-]+$/;
const HOSTNAME_REGEX = /^[A-Za-z0-9._-]+$/;
const IPV4_REGEX = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;

// Orden visual de los campos: sirve para enfocar el primero con error.
const FIELD_ORDER = [
  'codigo_inventario', 'tipo_impresora_id', 'marca', 'modelo', 'numero_serie',
  'ubicacion_id', 'tipo_conexion', 'ip', 'mac_address', 'hostname',
  'contador_impresiones', 'fecha_compra', 'garantia_vence', 'garantia_detalle',
  'observaciones', 'colaborador_id', 'fecha_asignacion',
];

function initialValues(p) {
  return {
    codigo_inventario: p?.codigo_inventario ?? '',
    tipo_impresora_id: p ? String(p.tipo_id) : '',
    marca: p?.marca ?? '',
    modelo: p?.modelo ?? '',
    numero_serie: p?.numero_serie ?? '',
    ubicacion_id: p?.ubicacion_id ? String(p.ubicacion_id) : '',
    tipo_conexion: p?.tipo_conexion ?? '',
    ip: p?.ip ?? '',
    mac_address: p?.mac_address ?? '',
    hostname: p?.hostname ?? '',
    imprime_color: !!p?.imprime_color,
    duplex: !!p?.duplex,
    contador_impresiones: p?.contador_impresiones ?? '',
    fecha_compra: p?.fecha_compra ?? '',
    garantia_vence: p?.garantia_vence ?? '',
    garantia_detalle: p?.garantia_detalle ?? '',
    observaciones: p?.observaciones ?? '',
    fecha_asignacion: todayISO(),
    observaciones_asignacion: '',
  };
}

// Mismas reglas que el backend (que sigue siendo la validacion definitiva).
function validate(v) {
  const e = {};
  const code = v.codigo_inventario.trim();
  if (code && !CODE_REGEX.test(code)) e.codigo_inventario = 'Solo letras, números, puntos, guiones y guion bajo.';
  if (!v.tipo_impresora_id) e.tipo_impresora_id = 'Selecciona el tipo de impresora.';
  const ip = v.ip.trim();
  if (ip && !IPV4_REGEX.test(ip) && !(ip.includes(':') && /^[0-9a-f:.]+$/i.test(ip))) {
    e.ip = 'La dirección IP no es válida.';
  }
  const mac = v.mac_address.trim();
  if (mac && !/^[0-9a-f]{12}$/i.test(mac.replace(/[:\-.\s]/g, ''))) {
    e.mac_address = 'La MAC debe tener 12 dígitos hexadecimales (AA:BB:CC:DD:EE:FF).';
  }
  const host = v.hostname.trim();
  if (host && !HOSTNAME_REGEX.test(host)) e.hostname = 'Solo letras, números, puntos, guiones y guion bajo.';
  const contador = String(v.contador_impresiones).trim();
  if (contador && !/^\d+$/.test(contador)) e.contador_impresiones = 'Debe ser un número entero mayor o igual a 0.';
  return e;
}

const Check = ({ id, label, checked, onChange }) => (
  <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500/30"
    />
    {label}
  </label>
);

/**
 * Formulario modal de Impresora (crear: impresora = null; editar: detalle de la impresora).
 * La ubicacion es donde esta fisicamente; el responsable ("Colaborador actual")
 * es aparte y opcional: se registra como una asignacion con su historial.
 */
export default function ImpresoraForm({ impresora, onClose, onSaved }) {
  const isEdit = !!impresora;
  const toast = useToast();

  const initial = useMemo(() => initialValues(impresora), [impresora]);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const { holder, setHolder, initialHolder, holderChanged, canChangeHolder } = useHolder(impresora);
  const image = useImageField(imagenUrl('impresoras', impresora?.imagen));

  const [tipos, setTipos] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [catalogError, setCatalogError] = useState('');
  useEffect(() => {
    let cancelled = false;
    Promise.all([catalogoService.list('tipos-impresora'), catalogoService.list('ubicaciones')])
      .then(([t, u]) => {
        if (cancelled) return;
        setTipos(t.data.items);
        setUbicaciones(u.data.items);
      })
      .catch((err) => !cancelled && setCatalogError(err.message));
    return () => { cancelled = true; };
  }, []);

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
  const sortByName = (list) => [...list].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

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

    const payload = {
      ...values,
      tipo_impresora_id: Number(values.tipo_impresora_id),
      ubicacion_id: values.ubicacion_id ? Number(values.ubicacion_id) : '',
    };
    if (canChangeHolder) payload.colaborador_id = holder?.id ?? ''; // '' = sin asignar
    if (!holderChanged || !holder) {
      delete payload.fecha_asignacion;
      delete payload.observaciones_asignacion;
    }

    setSaving(true);
    try {
      const { item, imageFailure } = await saveInventario({
        service: impresoraService,
        id: impresora?.id,
        payload,
        image,
        hadImage: !!impresora?.imagen,
      });
      toast.success(isEdit ? 'Impresora actualizada correctamente.' : 'Impresora creada correctamente.');
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
      title={isEdit ? 'Editar impresora' : 'Nueva impresora'}
      subtitle={isEdit ? `${impresora.codigo_inventario} · ${impresora.titulo || impresora.tipo}` : 'Registra una impresora en el inventario.'}
      formId="impresora-form"
      submitLabel={isEdit ? 'Guardar cambios' : 'Crear impresora'}
      saving={saving}
      dirty={dirty}
      formError={formError || (catalogError && `No se pudieron cargar los catálogos: ${catalogError}`)}
      onClose={onClose}
    >
      <form id="impresora-form" onSubmit={handleSubmit} noValidate>
        <FormSection title="Información general">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[9rem_1fr]">
            <ImageUploader kind="impresoras" field={image} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Código de inventario"
                htmlFor="f-codigo_inventario"
                error={errors.codigo_inventario}
                hint={isEdit ? undefined : 'Déjalo vacío para generarlo (IMP-00025).'}
              >
                <Input {...bind('codigo_inventario')} maxLength={60} placeholder={isEdit ? '' : 'Automático'} />
              </Field>
              <Field label="Tipo de impresora" htmlFor="f-tipo_impresora_id" required error={errors.tipo_impresora_id}>
                <CatalogSelect
                  id="f-tipo_impresora_id"
                  tipo="tipos-impresora"
                  singular="tipo"
                  items={tipos}
                  value={values.tipo_impresora_id}
                  error={errors.tipo_impresora_id}
                  onChange={(v) => set('tipo_impresora_id', v)}
                  onCreated={(item) => {
                    setTipos((list) => sortByName([...list, item]));
                    set('tipo_impresora_id', String(item.id));
                  }}
                />
              </Field>
              <Field label="Marca" htmlFor="f-marca" error={errors.marca}>
                <Input {...bind('marca')} maxLength={80} />
              </Field>
              <Field label="Modelo" htmlFor="f-modelo" error={errors.modelo}>
                <Input {...bind('modelo')} maxLength={120} />
              </Field>
              <Field label="Número de serie" htmlFor="f-numero_serie" error={errors.numero_serie} className="sm:col-span-2">
                <Input {...bind('numero_serie')} maxLength={120} />
              </Field>
            </div>
          </div>
        </FormSection>

        <FormSection title="Ubicación y características">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Ubicación"
              htmlFor="f-ubicacion_id"
              error={errors.ubicacion_id}
              hint="Dónde está físicamente; es independiente de quién la tiene a su cargo."
            >
              <CatalogSelect
                id="f-ubicacion_id"
                tipo="ubicaciones"
                singular="ubicación"
                items={ubicaciones}
                value={values.ubicacion_id}
                error={errors.ubicacion_id}
                onChange={(v) => set('ubicacion_id', v)}
                onCreated={(item) => {
                  setUbicaciones((list) => sortByName([...list, item]));
                  set('ubicacion_id', String(item.id));
                }}
              />
            </Field>
            <Field label="Tipo de conexión" htmlFor="f-tipo_conexion" error={errors.tipo_conexion}>
              <Select {...bind('tipo_conexion')}>
                <option value="">Sin especificar</option>
                {Object.entries(TIPOS_CONEXION).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Contador de impresiones" htmlFor="f-contador_impresiones" error={errors.contador_impresiones} hint="Lectura manual del contador de páginas.">
              <Input {...bind('contador_impresiones')} inputMode="numeric" maxLength={10} />
            </Field>
            <div className="flex flex-col justify-center gap-3 sm:pt-6">
              <Check id="f-imprime_color" label="Imprime a color" checked={values.imprime_color} onChange={(v) => set('imprime_color', v)} />
              <Check id="f-duplex" label="Impresión a doble cara (dúplex)" checked={values.duplex} onChange={(v) => set('duplex', v)} />
            </div>
          </div>
        </FormSection>

        <FormSection title="Red">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Dirección IP" htmlFor="f-ip" error={errors.ip}>
              <Input {...bind('ip')} maxLength={45} placeholder="192.168.1.50" />
            </Field>
            <Field label="Dirección MAC" htmlFor="f-mac_address" error={errors.mac_address}>
              <Input {...bind('mac_address')} maxLength={17} placeholder="AA:BB:CC:DD:EE:FF" />
            </Field>
            <Field label="Hostname" htmlFor="f-hostname" error={errors.hostname}>
              <Input {...bind('hostname')} maxLength={63} />
            </Field>
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
            <Field label="Detalle de garantía" htmlFor="f-garantia_detalle" error={errors.garantia_detalle} className="sm:col-span-2">
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
          kind="impresoras"
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
