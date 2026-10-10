import { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext.jsx';
import { empresaService } from '../../services/cartaService';

// Todos los campos editables de la empresa. El backend guarda la fila completa en cada PUT,
// asi que cada seccion envia TODOS (los de las otras secciones se reenvian sin cambios).
const ALL_FIELDS = [
  'nombre', 'descripcion', 'rfc', 'direccion', 'telefono', 'correo', 'sitio_web',
  'pie_documento', 'encabezado_documento', 'formato_fecha',
  'entrega_nombre', 'entrega_cargo', 'folio_prefijo', 'texto_declaracion', 'texto_condiciones',
];

const pick = (empresa, fields) => Object.fromEntries(fields.map((f) => [f, empresa[f] ?? '']));

/**
 * Carga la empresa y maneja el formulario de UNA seccion (`fields` = sus campos).
 * Empresa y Documentos comparten el mismo registro (/api/empresa) pero se editan por separado.
 */
export function useEmpresaForm(fields, successMessage) {
  const toast = useToast();
  const [empresa, setEmpresa] = useState(null);
  const [values, setValues] = useState(null);
  const [errors, setErrors] = useState({});
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoadError('');
    empresaService
      .get()
      .then((res) => {
        if (cancelled) return;
        setEmpresa(res.data.empresa);
        setValues(pick(res.data.empresa, fields));
      })
      .catch((err) => !cancelled && setLoadError(err.message));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  const set = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };
  const bind = (name) => ({ id: `e-${name}`, value: values[name], error: errors[name], onChange: (e) => set(name, e.target.value) });

  const dirty = !!values && JSON.stringify(values) !== JSON.stringify(pick(empresa, fields));

  /** `validate(values)` devuelve { campo: mensaje }; si hay errores no se envia nada. */
  const save = async (validate) => {
    setFormError('');
    const found = validate?.(values) || {};
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      const res = await empresaService.update({ ...pick(empresa, ALL_FIELDS), ...values });
      setEmpresa(res.data.empresa);
      setValues(pick(res.data.empresa, fields));
      toast.success(successMessage);
    } catch (err) {
      setErrors(err.errors || {});
      setFormError(err.errors ? '' : err.message);
    } finally {
      setSaving(false);
    }
  };

  return {
    empresa, setEmpresa, values, errors, loadError, formError, saving, dirty,
    bind, save, reload: () => setReloadKey((k) => k + 1),
  };
}
