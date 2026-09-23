import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import InventarioFormShell from './InventarioFormShell.jsx';
import ImageUploader from './ImageUploader.jsx';
import { ColaboradorPicker } from './pickers.jsx';
import { saveInventario } from './saveInventario.js';
import CatalogSelect from '../colaboradores/CatalogSelect.jsx';
import Button from '../ui/Button.jsx';
import FormSection from '../ui/FormSection.jsx';
import { Field, Input, Select, Textarea } from '../ui/FormField.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useImageField } from '../../hooks/useImageField';
import { catalogoService } from '../../services/colaboradorService';
import { equipoService, imagenUrl } from '../../services/inventarioService';
import { ESTADOS_FISICOS } from '../../utils/inventarioConfig';
import { todayISO } from '../../utils/formatters';

const CODE_REGEX = /^[A-Za-z0-9._-]+$/;
const HOSTNAME_REGEX = /^[A-Za-z0-9._-]+$/;

// Orden visual de los campos: sirve para enfocar el primero con error.
const FIELD_ORDER = [
  'codigo_inventario', 'tipo_equipo_id', 'marca', 'modelo', 'numero_serie',
  'procesador', 'ram', 'disco_duro', 'tarjeta_madre', 'tarjeta_grafica', 'sistema_operativo',
  'componentes', 'mac_address', 'hostname', 'password_equipo', 'fecha_compra', 'garantia_vence', 'garantia_detalle',
  'estado_fisico', 'observaciones', 'colaborador_id', 'fecha_asignacion',
];

function initialValues(e) {
  return {
    codigo_inventario: e?.codigo_inventario ?? '',
    tipo_equipo_id: e ? String(e.tipo_id) : '',
    marca: e?.marca ?? '',
    modelo: e?.modelo ?? '',
    numero_serie: e?.numero_serie ?? '',
    procesador: e?.procesador ?? '',
    ram: e?.ram ?? '',
    disco_duro: e?.disco_duro ?? '',
    tarjeta_madre: e?.tarjeta_madre ?? '',
    tarjeta_grafica: e?.tarjeta_grafica ?? '',
    sistema_operativo: e?.sistema_operativo ?? '',
    componentes: (e?.componentes_adicionales ?? []).join('\n'),
    mac_address: e?.mac_address ?? '',
    hostname: e?.hostname ?? '',
    fecha_compra: e?.fecha_compra ?? '',
    garantia_vence: e?.garantia_vence ?? '',
    garantia_detalle: e?.garantia_detalle ?? '',
    estado_fisico: e?.estado_fisico ?? '',
    observaciones: e?.observaciones ?? '',
    fecha_asignacion: todayISO(),
    observaciones_asignacion: '',
  };
}

// Mismas reglas que el backend (que sigue siendo la validacion definitiva).
function validate(v) {
  const e = {};
  const code = v.codigo_inventario.trim();
  if (code && !CODE_REGEX.test(code)) e.codigo_inventario = 'Solo letras, números, puntos, guiones y guion bajo.';
  if (!v.tipo_equipo_id) e.tipo_equipo_id = 'Selecciona el tipo de equipo.';
  const mac = v.mac_address.trim();
  if (mac && !/^[0-9a-f]{12}$/i.test(mac.replace(/[:\-.\s]/g, ''))) {
    e.mac_address = 'La MAC debe tener 12 dígitos hexadecimales (AA:BB:CC:DD:EE:FF).';
  }
  const host = v.hostname.trim();
  if (host && !HOSTNAME_REGEX.test(host)) e.hostname = 'Solo letras, números, puntos, guiones y guion bajo.';
  const lines = v.componentes.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length > 20) e.componentes = 'Máximo 20 componentes.';
  return e;
}

/**
 * Formulario modal de Equipo (crear: equipo = null; editar: detalle del equipo).
 * "Colaborador actual" no se guarda en el equipo: al cambiarlo el backend
 * cierra la asignacion vigente y crea una nueva (queda en el historial).
 */
export default function EquipoForm({ equipo, onClose, onSaved }) {
  const isEdit = !!equipo;
  const toast = useToast();

  const initial = useMemo(() => initialValues(equipo), [equipo]);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // La contrasena no viaja en `values`/`initial`: nunca llega en claro del backend
  // (solo `tiene_password`), asi que se maneja aparte, igual que en RedForm.
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [cambiarPassword, setCambiarPassword] = useState(!isEdit);

  const initialHolder = equipo?.asignacion_actual
    ? {
        id: equipo.asignacion_actual.colaborador_id,
        nombre_completo: equipo.asignacion_actual.nombre_completo,
        id_empleado: equipo.asignacion_actual.id_empleado,
      }
    : null;
  const [holder, setHolder] = useState(initialHolder);
  const holderChanged = (holder?.id ?? null) !== (initialHolder?.id ?? null);
  // Un equipo en mantenimiento/reparacion/baja/perdido no se puede asignar.
  const canChangeHolder = !isEdit || equipo.estado === 'disponible' || equipo.estado === 'asignado';

  const image = useImageField(imagenUrl('equipos', equipo?.imagen));

  const [tipos, setTipos] = useState([]);
  const [catalogError, setCatalogError] = useState('');
  useEffect(() => {
    let cancelled = false;
    catalogoService
      .list('tipos-equipo')
      .then((res) => !cancelled && setTipos(res.data.items))
      .catch((err) => !cancelled && setCatalogError(err.message));
    return () => { cancelled = true; };
  }, []);

  const dirty = useMemo(
    () =>
      JSON.stringify(values) !== JSON.stringify(initial) ||
      holderChanged ||
      image.dirty ||
      (cambiarPassword && password !== ''),
    [values, initial, holderChanged, image.dirty, cambiarPassword, password]
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
      tipo_equipo_id: Number(values.tipo_equipo_id),
      componentes_adicionales: componentes.split('\n').map((l) => l.trim()).filter(Boolean),
    };
    if (canChangeHolder) payload.colaborador_id = holder?.id ?? ''; // '' = sin asignar
    // Sin tocar el campo: no se envia (undefined = "conservar la contraseña guardada").
    if (cambiarPassword) payload.password_equipo = password;
    if (!holderChanged || !holder) {
      delete payload.fecha_asignacion;
      delete payload.observaciones_asignacion;
    }

    setSaving(true);
    try {
      const { item, imageFailure } = await saveInventario({
        service: equipoService,
        id: equipo?.id,
        payload,
        image,
        hadImage: !!equipo?.imagen,
      });
      toast.success(isEdit ? 'Equipo actualizado correctamente.' : 'Equipo creado correctamente.');
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
      title={isEdit ? 'Editar equipo' : 'Nuevo equipo'}
      subtitle={isEdit ? `${equipo.codigo_inventario} · ${equipo.titulo || equipo.tipo}` : 'Registra un equipo en el inventario.'}
      formId="equipo-form"
      submitLabel={isEdit ? 'Guardar cambios' : 'Crear equipo'}
      saving={saving}
      dirty={dirty}
      formError={formError || (catalogError && `No se pudieron cargar los tipos: ${catalogError}`)}
      onClose={onClose}
    >
      <form id="equipo-form" onSubmit={handleSubmit} noValidate>
        <FormSection title="Información general">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[9rem_1fr]">
            <ImageUploader kind="equipos" field={image} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Código de inventario"
                htmlFor="f-codigo_inventario"
                error={errors.codigo_inventario}
                hint={isEdit ? undefined : 'Déjalo vacío para generarlo (EQ-00025).'}
              >
                <Input {...bind('codigo_inventario')} maxLength={60} placeholder={isEdit ? '' : 'Automático'} />
              </Field>
              <Field label="Tipo de equipo" htmlFor="f-tipo_equipo_id" required error={errors.tipo_equipo_id}>
                <CatalogSelect
                  id="f-tipo_equipo_id"
                  tipo="tipos-equipo"
                  singular="tipo"
                  items={tipos}
                  value={values.tipo_equipo_id}
                  error={errors.tipo_equipo_id}
                  onChange={(v) => set('tipo_equipo_id', v)}
                  onCreated={(item) => {
                    setTipos((list) => [...list, item].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')));
                    set('tipo_equipo_id', String(item.id));
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

        <FormSection title="Características">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Procesador" htmlFor="f-procesador" error={errors.procesador}>
              <Input {...bind('procesador')} maxLength={120} />
            </Field>
            <Field label="RAM" htmlFor="f-ram" error={errors.ram}>
              <Input {...bind('ram')} maxLength={60} placeholder="Ej. 16 GB" />
            </Field>
            <Field label="Disco" htmlFor="f-disco_duro" error={errors.disco_duro}>
              <Input {...bind('disco_duro')} maxLength={120} placeholder="Ej. SSD 512 GB" />
            </Field>
            <Field label="Sistema operativo" htmlFor="f-sistema_operativo" error={errors.sistema_operativo}>
              <Input {...bind('sistema_operativo')} maxLength={80} />
            </Field>
            <Field label="Tarjeta madre" htmlFor="f-tarjeta_madre" error={errors.tarjeta_madre}>
              <Input {...bind('tarjeta_madre')} maxLength={120} />
            </Field>
            <Field label="Tarjeta gráfica" htmlFor="f-tarjeta_grafica" error={errors.tarjeta_grafica}>
              <Input {...bind('tarjeta_grafica')} maxLength={120} />
            </Field>
            <Field
              label="Componentes adicionales"
              htmlFor="f-componentes"
              error={errors.componentes}
              hint="Uno por línea."
              className="sm:col-span-2"
            >
              <Textarea {...bind('componentes')} rows={3} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Red">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Dirección MAC" htmlFor="f-mac_address" error={errors.mac_address}>
              <Input {...bind('mac_address')} maxLength={17} placeholder="AA:BB:CC:DD:EE:FF" />
            </Field>
            <Field label="Hostname" htmlFor="f-hostname" error={errors.hostname}>
              <Input {...bind('hostname')} maxLength={63} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Acceso">
          <Field
            label="Contraseña del equipo"
            htmlFor="f-password_equipo"
            error={errors.password_equipo}
            hint={
              isEdit && !cambiarPassword
                ? 'Se conserva la actual. Solo un administrador puede revelarla después.'
                : 'Se guarda cifrada; nadie la ve directamente en las tablas.'
            }
          >
            {isEdit && !cambiarPassword ? (
              <Button type="button" variant="secondary" onClick={() => setCambiarPassword(true)}>
                {equipo.tiene_password ? 'Cambiar contraseña' : 'Establecer contraseña'}
              </Button>
            ) : (
              <div className="relative">
                <Input
                  id="f-password_equipo" type={passwordVisible ? 'text' : 'password'} value={password}
                  error={errors.password_equipo} onChange={(e) => setPassword(e.target.value)} maxLength={128}
                  className="pr-10" autoComplete="new-password"
                />
                <button type="button" onClick={() => setPasswordVisible((v) => !v)} aria-label={passwordVisible ? 'Ocultar' : 'Mostrar'} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600">
                  {passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            )}
          </Field>
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

        <FormSection title="Estado físico">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Estado físico" htmlFor="f-estado_fisico" error={errors.estado_fisico}>
              <Select {...bind('estado_fisico')}>
                <option value="">Sin especificar</option>
                {Object.entries(ESTADOS_FISICOS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Observaciones e incidentes" htmlFor="f-observaciones" error={errors.observaciones} className="sm:col-span-2">
              <Textarea {...bind('observaciones')} rows={3} />
            </Field>
          </div>
        </FormSection>

        <FormSection
          title="Asignación"
          description="El equipo no guarda a su responsable: se registra una asignación con su historial."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Colaborador actual"
              htmlFor="f-colaborador_id"
              error={errors.colaborador_id}
              className="sm:col-span-2"
              hint={
                !canChangeHolder
                  ? 'Solo se puede asignar un equipo disponible. Cambia su estado primero.'
                  : isEdit && holderChanged && initialHolder
                    ? 'Se cerrará la asignación actual (sin evaluar su condición) y se creará una nueva. Para registrar daños usa "Devolver" en el detalle.'
                    : 'Déjalo vacío para que el equipo quede sin asignar (Disponible).'
              }
            >
              <ColaboradorPicker
                id="f-colaborador_id"
                value={holder}
                onChange={setHolder}
                error={errors.colaborador_id}
                disabled={!canChangeHolder}
                placeholder="Sin asignar — busca un colaborador para asignarlo"
              />
            </Field>
            {holderChanged && holder && (
              <>
                <Field label="Fecha de asignación" htmlFor="f-fecha_asignacion" error={errors.fecha_asignacion}>
                  <Input {...bind('fecha_asignacion')} type="date" max={todayISO()} />
                </Field>
                <Field label="Observaciones de la asignación" htmlFor="f-observaciones_asignacion">
                  <Input {...bind('observaciones_asignacion')} maxLength={1000} />
                </Field>
              </>
            )}
          </div>
        </FormSection>
      </form>
    </InventarioFormShell>
  );
}
