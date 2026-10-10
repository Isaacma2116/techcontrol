import { useState } from 'react';
import { CheckCircle2, Plus, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Field, Input, Select, Textarea } from '../ui/FormField.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { mantenimientoService } from '../../services/mantenimientoService';
import { ACCIONES_COMPONENTE, COMPONENTES_SUGERIDOS } from '../../utils/mantenimientosConfig';
import { todayISO } from '../../utils/formatters';

const filaVacia = () => ({ accion: 'reemplazado', componente: '', detalle: '', numero_serie: '', costo: '' });

/**
 * Registra lo que se hizo el dia del mantenimiento: la descripcion del trabajo y,
 * opcionalmente, las piezas que se cambiaron (RAM, disco, bateria...).
 * Si el mantenimiento ya estaba realizado, el mismo formulario sirve para corregirlo.
 */
export default function RealizarModal({ mantenimiento, onClose, onDone }) {
  const toast = useToast();
  const correccion = mantenimiento.estado === 'realizado';

  const [values, setValues] = useState({
    fecha_realizado: mantenimiento.fecha_realizado || todayISO(),
    trabajo_realizado: mantenimiento.trabajo_realizado || '',
    costo: mantenimiento.costo ?? '',
    proveedor: mantenimiento.proveedor || '',
  });
  const [componentes, setComponentes] = useState(
    (mantenimiento.componentes || []).map((c) => ({
      accion: c.accion, componente: c.componente, detalle: c.detalle || '',
      numero_serie: c.numero_serie || '', costo: c.costo ?? '',
    }))
  );
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };
  const bind = (name) => ({ id: `r-${name}`, value: values[name], error: errors[name], onChange: (e) => set(name, e.target.value) });

  const setFila = (i, campo, valor) => {
    setComponentes((list) => list.map((f, idx) => (idx === i ? { ...f, [campo]: valor } : f)));
    if (errors.componentes) setErrors((e) => ({ ...e, componentes: undefined }));
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setFormError('');
    if (!values.trabajo_realizado.trim()) {
      return setErrors({ trabajo_realizado: 'Describe lo que se realizó.' });
    }
    // Las filas vacias simplemente no se envian.
    const limpias = componentes.filter((c) => c.componente.trim());
    if (componentes.some((c) => !c.componente.trim() && (c.detalle.trim() || c.numero_serie.trim() || c.costo))) {
      return setErrors({ componentes: 'Falta el nombre de alguno de los componentes.' });
    }
    setErrors({});

    setSaving(true);
    try {
      const res = await mantenimientoService.realizar(mantenimiento.id, {
        ...values,
        costo: values.costo === '' ? null : Number(values.costo),
        componentes: limpias.map((c) => ({
          accion: c.accion,
          componente: c.componente.trim(),
          detalle: c.detalle.trim() || null,
          numero_serie: c.numero_serie.trim() || null,
          costo: c.costo === '' ? null : Number(c.costo),
        })),
      });
      toast.success(res.message);
      onDone(res.data.mantenimiento);
    } catch (err) {
      setErrors(err.errors || {});
      setFormError(err.errors ? '' : err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={correccion ? `Corregir lo realizado · ${mantenimiento.folio}` : `Registrar mantenimiento realizado · ${mantenimiento.folio}`}
      subtitle={`${mantenimiento.recurso.codigo_inventario} · ${mantenimiento.recurso.titulo || mantenimiento.recurso.tipo}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="form-realizar" icon={CheckCircle2} loading={saving}>
            {correccion ? 'Guardar cambios' : 'Marcar como realizado'}
          </Button>
        </>
      }
    >
      <form id="form-realizar" onSubmit={handleSubmit} noValidate className="space-y-5">
        {formError && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{formError}</div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Fecha en que se hizo" htmlFor="r-fecha_realizado" required error={errors.fecha_realizado}>
            <Input {...bind('fecha_realizado')} type="date" />
          </Field>
          <Field label="Costo" htmlFor="r-costo" error={errors.costo} hint="Opcional">
            <Input {...bind('costo')} type="number" min="0" step="0.01" placeholder="0.00" />
          </Field>
          <Field label="Proveedor externo" htmlFor="r-proveedor" error={errors.proveedor} hint="Si lo hizo un tercero">
            <Input {...bind('proveedor')} maxLength={150} />
          </Field>
        </div>

        <Field
          label="¿Qué se realizó?"
          htmlFor="r-trabajo_realizado"
          required
          error={errors.trabajo_realizado}
          hint="Describe el trabajo de ese día: limpieza, cambios, pruebas, lo que quedó pendiente…"
        >
          <Textarea
            {...bind('trabajo_realizado')}
            rows={5}
            maxLength={5000}
            placeholder="Ej. Se abrió el equipo, se limpiaron ventiladores, se cambió la pasta térmica y se amplió la RAM de 8 a 16 GB."
          />
        </Field>

        <div className="border-t border-slate-100 pt-4">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-slate-800">Componentes cambiados</h4>
            <Button variant="secondary" icon={Plus} onClick={() => setComponentes((l) => [...l, filaVacia()])}>
              Agregar componente
            </Button>
          </div>
          <p className="mb-3 text-xs text-slate-500">
            Opcional. Anota cada pieza por separado para poder consultarla después (por ejemplo, a qué equipos se les cambió RAM).
          </p>

          {errors.componentes && <p className="mb-2 text-xs text-red-600" role="alert">{errors.componentes}</p>}

          {componentes.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-xs text-slate-500">
              No se cambió ninguna pieza.
            </p>
          ) : (
            <ul className="space-y-3">
              <datalist id="componentes-sugeridos">
                {COMPONENTES_SUGERIDOS.map((c) => <option key={c} value={c} />)}
              </datalist>
              {componentes.map((fila, i) => (
                <li key={i} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                    <div className="sm:col-span-3">
                      <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor={`c-accion-${i}`}>Acción</label>
                      <Select id={`c-accion-${i}`} value={fila.accion} onChange={(e) => setFila(i, 'accion', e.target.value)}>
                        {Object.entries(ACCIONES_COMPONENTE).map(([valor, label]) => (
                          <option key={valor} value={valor}>{label}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="sm:col-span-3">
                      <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor={`c-componente-${i}`}>Componente</label>
                      <Input
                        id={`c-componente-${i}`}
                        list="componentes-sugeridos"
                        value={fila.componente}
                        onChange={(e) => setFila(i, 'componente', e.target.value)}
                        maxLength={100}
                        placeholder="RAM, disco, batería…"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor={`c-detalle-${i}`}>Detalle</label>
                      <Input
                        id={`c-detalle-${i}`}
                        value={fila.detalle}
                        onChange={(e) => setFila(i, 'detalle', e.target.value)}
                        maxLength={255}
                        placeholder="8 GB DDR4 → 16 GB DDR4"
                      />
                    </div>
                    <div className="flex items-end gap-2 sm:col-span-2">
                      <div className="flex-1">
                        <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor={`c-costo-${i}`}>Costo</label>
                        <Input
                          id={`c-costo-${i}`}
                          type="number" min="0" step="0.01"
                          value={fila.costo}
                          onChange={(e) => setFila(i, 'costo', e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setComponentes((l) => l.filter((_, idx) => idx !== i))}
                        aria-label={`Quitar el componente ${i + 1}`}
                        className="mb-1 rounded-lg border border-slate-300 bg-white p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor={`c-serie-${i}`}>
                      Número de serie de la pieza
                    </label>
                    <Input
                      id={`c-serie-${i}`}
                      value={fila.numero_serie}
                      onChange={(e) => setFila(i, 'numero_serie', e.target.value)}
                      maxLength={120}
                      placeholder="Opcional"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </form>
    </Modal>
  );
}
