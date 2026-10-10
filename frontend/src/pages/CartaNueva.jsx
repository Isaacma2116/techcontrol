import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, FileCheck, Loader2, PackagePlus, RefreshCw, Save, ScrollText } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import { Field, Input, Textarea } from '../components/ui/FormField.jsx';
import { ColaboradorPicker } from '../components/inventario/pickers.jsx';
import TipoItem from '../components/inventario/TipoItem.jsx';
import AsignarModal from '../components/inventario/AsignarModal.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { cartaService, empresaService } from '../services/cartaService';
import { colaboradorService } from '../services/colaboradorService';
import { FILTROS_RECURSO, TIPOS_RECURSO } from '../utils/cartasConfig';
import { formatDate, todayISO } from '../utils/formatters';

const keyOf = (r) => `${r.categoria}:${r.asignacion_id}`;

/** 'YYYY-MM-DDTHH:mm...Z' (DATETIME) -> 'YYYY-MM-DD' en hora local. */
function localDate(iso) {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function Step({ number, title, children, aside }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-900 text-xs text-oncolor">{number}</span>
          {title}
        </h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

/**
 * Nueva carta / edicion de un borrador. Los datos del colaborador y de cada recurso
 * se leen de la base (nada se captura a mano); solo se eligen recursos ya asignados.
 * La vista previa es el PDF real que genera el servidor (con marca de agua BORRADOR).
 */
export default function CartaNueva() {
  const { id: idParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [cartaId, setCartaId] = useState(idParam ? Number(idParam) : null);
  const [folio, setFolio] = useState('');
  const [loadingCarta, setLoadingCarta] = useState(!!idParam);
  const [loadError, setLoadError] = useState('');

  const [colaborador, setColaborador] = useState(null);
  const [vigentes, setVigentes] = useState([]);
  const [vigLoading, setVigLoading] = useState(false);
  const [filtro, setFiltro] = useState('TODOS');
  const [seleccion, setSeleccion] = useState(new Set());
  const [values, setValues] = useState({
    fecha_entrega: todayISO(), fecha_devolucion_esperada: '', entrega_nombre: '', entrega_cargo: '',
    observaciones: '', condiciones_especiales: '',
  });
  const [fechaTouched, setFechaTouched] = useState(!!idParam);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(''); // 'guardar' | 'preview' | 'generar'
  const [preview, setPreview] = useState({ url: null, loading: false, error: '' });
  const [asignarKind, setAsignarKind] = useState(null);

  const set = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  // --- Carga inicial: edicion de un borrador, o valores por defecto de una carta nueva ---
  useEffect(() => {
    let cancelled = false;
    if (idParam) {
      cartaService
        .getById(idParam)
        .then((res) => {
          if (cancelled) return;
          const c = res.data.carta;
          if (c.estado !== 'borrador') return navigate(`/cartas-responsivas/${c.id}`, { replace: true });
          setFolio(c.folio);
          setColaborador(c.colaborador);
          setSeleccion(new Set(c.recursos.map((r) => `${r.tipo}:${r.asignacion_id}`)));
          setValues({
            fecha_entrega: c.fecha_entrega, fecha_devolucion_esperada: c.fecha_devolucion_esperada || '',
            entrega_nombre: c.entrega_nombre || '', entrega_cargo: c.entrega_cargo || '',
            observaciones: c.observaciones || '', condiciones_especiales: c.condiciones_especiales || '',
          });
        })
        .catch((err) => !cancelled && setLoadError(err.message))
        .finally(() => !cancelled && setLoadingCarta(false));
    } else {
      empresaService
        .get()
        .then((res) => !cancelled && setValues((v) => ({ ...v, entrega_nombre: res.data.empresa.entrega_nombre || '', entrega_cargo: res.data.empresa.entrega_cargo || '' })))
        .catch(() => {});
      const pre = searchParams.get('colaborador');
      if (pre) colaboradorService.getById(pre).then((res) => !cancelled && setColaborador(res.data.colaborador)).catch(() => {});
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idParam]);

  // --- Recursos asignados al colaborador ---
  const loadVigentes = useCallback(() => {
    if (!colaborador) return Promise.resolve();
    setVigLoading(true);
    return colaboradorService
      .getVigentes(colaborador.id)
      .then((res) => setVigentes(res.data.items))
      .catch((err) => toast.error(err.message))
      .finally(() => setVigLoading(false));
  }, [colaborador?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!colaborador) return setVigentes([]);
    loadVigentes();
  }, [colaborador?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeColaborador = (c) => {
    setColaborador(c);
    setSeleccion(new Set()); // los recursos son de UN colaborador
    setErrors((e) => ({ ...e, colaborador_id: undefined, items: undefined }));
  };

  const visibles = useMemo(() => {
    const f = FILTROS_RECURSO.find((x) => x.key === filtro);
    return vigentes.filter(f.match);
  }, [vigentes, filtro]);

  const toggle = (r) => {
    const key = keyOf(r);
    setSeleccion((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
    setErrors((e) => ({ ...e, items: undefined }));
  };

  // La fecha de entrega sugerida es la de la asignacion mas reciente (mientras no la edites).
  useEffect(() => {
    if (fechaTouched) return;
    const fechas = vigentes.filter((r) => seleccion.has(keyOf(r))).map((r) => localDate(r.fecha_asignacion)).sort();
    if (fechas.length) setValues((v) => ({ ...v, fecha_entrega: fechas[fechas.length - 1] }));
  }, [seleccion, vigentes, fechaTouched]);

  // --- Guardar / vista previa / generar ---
  const validate = ({ paraGenerar }) => {
    const e = {};
    if (!colaborador) e.colaborador_id = 'Selecciona el colaborador.';
    if (seleccion.size === 0) e.items = 'Selecciona al menos un recurso.';
    if (!values.fecha_entrega) e.fecha_entrega = 'La fecha de entrega es obligatoria.';
    if (values.fecha_devolucion_esperada && values.fecha_devolucion_esperada < values.fecha_entrega) {
      e.fecha_devolucion_esperada = 'La devolución esperada no puede ser anterior a la entrega.';
    }
    if (paraGenerar) {
      if (!values.entrega_nombre.trim()) e.entrega_nombre = 'Indica quién entrega.';
      if (!values.entrega_cargo.trim()) e.entrega_cargo = 'Indica el cargo de quien entrega.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /** Crea o actualiza el borrador y devuelve su id (o null si hay errores). */
  const guardar = async (opts) => {
    setFormError('');
    if (!validate(opts)) return null;
    const payload = {
      colaborador_id: colaborador.id,
      items: [...seleccion].map((k) => { const [tipo, asignacion_id] = k.split(':'); return { tipo, asignacion_id: Number(asignacion_id) }; }),
      ...values,
    };
    try {
      let carta;
      if (cartaId) {
        carta = (await cartaService.update(cartaId, payload)).data.carta;
      } else {
        carta = (await cartaService.create(payload)).data.carta;
        setCartaId(carta.id);
        // La URL pasa a /:id/editar sin recargar la pantalla (se conserva la vista previa).
        window.history.replaceState(null, '', `/cartas-responsivas/${carta.id}/editar`);
      }
      setFolio(carta.folio);
      return carta.id;
    } catch (err) {
      setErrors(err.errors || {});
      setFormError(err.message);
      return null;
    }
  };

  const cargarPreview = async (id) => {
    setPreview((p) => ({ ...p, loading: true, error: '' }));
    try {
      const blob = await cartaService.previewBlob(id);
      setPreview((p) => { if (p.url) URL.revokeObjectURL(p.url); return { url: URL.createObjectURL(blob), loading: false, error: '' }; });
    } catch (err) {
      setPreview((p) => ({ ...p, loading: false, error: err.message }));
    }
  };
  useEffect(() => () => preview.url && URL.revokeObjectURL(preview.url), [preview.url]);

  const onGuardar = async () => {
    setBusy('guardar');
    const id = await guardar({ paraGenerar: false });
    setBusy('');
    if (id) toast.success('Borrador guardado.');
  };
  const onPreview = async () => {
    setBusy('preview');
    const id = await guardar({ paraGenerar: false });
    if (id) await cargarPreview(id);
    setBusy('');
  };
  const onGenerar = async () => {
    setBusy('generar');
    const id = await guardar({ paraGenerar: true });
    if (id) {
      try {
        await cartaService.generar(id);
        toast.success('PDF generado. Descárgalo, imprímelo y recaba las firmas.');
        navigate(`/cartas-responsivas/${id}`, { replace: true });
        return;
      } catch (err) {
        setErrors(err.errors || {});
        setFormError(err.message);
      }
    }
    setBusy('');
  };

  if (loadingCarta) {
    return <div className="mx-auto max-w-7xl"><div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white" /></div>;
  }
  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center text-sm text-red-700">
        <AlertCircle className="mx-auto mb-2" /> No se pudo cargar el borrador: {loadError}
        <div className="mt-4"><Link to="/cartas-responsivas" className="font-medium underline">Volver a cartas</Link></div>
      </div>
    );
  }

  const seleccionadas = vigentes.filter((r) => seleccion.has(keyOf(r)));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/cartas-responsivas" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-500">
            <ArrowLeft size={16} /> Volver a cartas
          </Link>
          <h2 className="mt-2 text-lg font-semibold text-slate-800">{cartaId ? `Editar borrador ${folio}` : 'Nueva carta responsiva'}</h2>
          <p className="text-sm text-slate-500">Los datos del colaborador y del recurso se toman automáticamente de la base de datos.</p>
        </div>
      </div>

      {formError && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" /> <span>{formError}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---------- Formulario ---------- */}
        <div className="space-y-5">
          <Step number={1} title="Colaborador">
            <Field label="Colaborador" htmlFor="carta-colaborador" required error={errors.colaborador_id}>
              <ColaboradorPicker id="carta-colaborador" value={colaborador} onChange={changeColaborador} error={errors.colaborador_id} />
            </Field>
            {colaborador && (
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-slate-50 p-4 text-sm">
                {[
                  ['Nombre completo', colaborador.nombre_completo], ['ID de empleado', colaborador.id_empleado],
                  ['Área / departamento', colaborador.area], ['Cargo', colaborador.cargo],
                  ['Correo', colaborador.correo_empresarial],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
                    <dd className="truncate text-slate-800">{value || '—'}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Step>

          <Step number={2} title="Recursos que se entregan" aside={seleccion.size > 0 && <Badge tone="blue" dot={false}>{seleccion.size} seleccionado(s)</Badge>}>
            {!colaborador ? (
              <p className="text-sm text-slate-400">Primero selecciona al colaborador.</p>
            ) : (
              <>
                <div className="mb-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Tipo de recurso">
                  {FILTROS_RECURSO.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      role="tab"
                      aria-selected={filtro === f.key}
                      onClick={() => setFiltro(f.key)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors
                        ${filtro === f.key ? 'border-brand-500 bg-brand-500/10 text-brand-500' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {vigLoading ? (
                  <p className="flex items-center gap-2 py-6 text-sm text-slate-400"><Loader2 size={16} className="animate-spin" /> Cargando recursos…</p>
                ) : visibles.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                    Este colaborador no tiene recursos de este tipo asignados.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200" role="group" aria-label="Recursos asignados">
                    {visibles.map((r) => {
                      const key = keyOf(r);
                      const bloqueada = r.carta && r.carta.id !== cartaId;
                      return (
                        <li key={key}>
                          <label className={`flex items-start gap-3 px-3 py-2.5 ${bloqueada ? 'cursor-not-allowed bg-slate-50 opacity-70' : 'cursor-pointer hover:bg-slate-50'}`}>
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500/30"
                              checked={seleccion.has(key)}
                              disabled={bloqueada}
                              onChange={() => toggle(r)}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-x-2 text-sm">
                                <TipoItem tipo={r.tipo} />
                                <span className="font-semibold text-slate-800">{r.codigo_inventario}</span>
                              </span>
                              <span className="block truncate text-sm text-slate-600">{r.descripcion || '—'}</span>
                              <span className="block text-xs text-slate-400">
                                {r.numero_serie ? `Serie: ${r.numero_serie}` : 'Sin número de serie'} · Asignado el {formatDate(r.fecha_asignacion)}
                              </span>
                            </span>
                            {bloqueada && <Badge tone="amber" dot={false}>En {r.carta.folio}</Badge>}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {errors.items && <p className="mt-2 text-xs text-red-600" role="alert">{errors.items}</p>}

                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className="mb-2 text-xs text-slate-500">¿No aparece el recurso? Debe estar asignado al colaborador. Asígnalo aquí:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.values(TIPOS_RECURSO).map(({ kind, label, icon: Icon }) => (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => setAsignarKind(kind)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        <PackagePlus size={14} /> <Icon size={14} className="text-slate-400" /> {label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </Step>

          <Step number={3} title="Datos de la carta">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Fecha de entrega" htmlFor="c-fecha_entrega" required error={errors.fecha_entrega}>
                <Input id="c-fecha_entrega" type="date" value={values.fecha_entrega} error={errors.fecha_entrega}
                  onChange={(e) => { setFechaTouched(true); set('fecha_entrega', e.target.value); }} />
              </Field>
              <Field label="Devolución esperada" htmlFor="c-fecha_devolucion_esperada" error={errors.fecha_devolucion_esperada} hint="Opcional">
                <Input id="c-fecha_devolucion_esperada" type="date" min={values.fecha_entrega} value={values.fecha_devolucion_esperada}
                  error={errors.fecha_devolucion_esperada} onChange={(e) => set('fecha_devolucion_esperada', e.target.value)} />
              </Field>
              <Field label="Nombre de quien entrega" htmlFor="c-entrega_nombre" error={errors.entrega_nombre}>
                <Input id="c-entrega_nombre" maxLength={150} value={values.entrega_nombre} error={errors.entrega_nombre} onChange={(e) => set('entrega_nombre', e.target.value)} />
              </Field>
              <Field label="Cargo de quien entrega" htmlFor="c-entrega_cargo" error={errors.entrega_cargo}>
                <Input id="c-entrega_cargo" maxLength={150} value={values.entrega_cargo} error={errors.entrega_cargo} onChange={(e) => set('entrega_cargo', e.target.value)} />
              </Field>
              <Field label="Condiciones especiales" htmlFor="c-condiciones_especiales" error={errors.condiciones_especiales} className="sm:col-span-2" hint="Se agregan a las condiciones generales de la carta.">
                <Textarea id="c-condiciones_especiales" maxLength={2000} value={values.condiciones_especiales} error={errors.condiciones_especiales} onChange={(e) => set('condiciones_especiales', e.target.value)} />
              </Field>
              <Field label="Observaciones" htmlFor="c-observaciones" error={errors.observaciones} className="sm:col-span-2">
                <Textarea id="c-observaciones" maxLength={2000} value={values.observaciones} error={errors.observaciones} onChange={(e) => set('observaciones', e.target.value)} />
              </Field>
            </div>
          </Step>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" icon={Save} loading={busy === 'guardar'} disabled={!!busy} onClick={onGuardar}>Guardar borrador</Button>
            <Button variant="secondary" icon={ScrollText} loading={busy === 'preview'} disabled={!!busy} onClick={onPreview}>Vista previa</Button>
            <Button icon={FileCheck} loading={busy === 'generar'} disabled={!!busy} onClick={onGenerar}>Generar PDF</Button>
          </div>
        </div>

        {/* ---------- Vista previa ---------- */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-800">Vista previa del documento</h3>
              {preview.url && (
                <button type="button" onClick={onPreview} disabled={!!busy} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-brand-500 disabled:opacity-50">
                  <RefreshCw size={14} /> Actualizar
                </button>
              )}
            </div>
            {preview.loading ? (
              <div className="flex h-[70vh] items-center justify-center gap-2 text-sm text-slate-500"><Loader2 size={18} className="animate-spin" /> Generando vista previa…</div>
            ) : preview.error ? (
              <p className="px-4 py-10 text-center text-sm text-red-600">{preview.error}</p>
            ) : preview.url ? (
              <iframe src={`${preview.url}#view=FitH`} title="Vista previa de la carta" className="h-[75vh] w-full" />
            ) : (
              <div className="flex h-[40vh] flex-col items-center justify-center gap-2 px-6 text-center">
                <ScrollText size={28} className="text-slate-300" />
                <p className="text-sm text-slate-500">
                  Selecciona al colaborador y sus recursos y pulsa <strong>Vista previa</strong> para ver la carta tal como se imprimirá.
                </p>
                {seleccionadas.length > 0 && <p className="text-xs text-slate-400">{seleccionadas.length} recurso(s) seleccionado(s)</p>}
              </div>
            )}
          </div>
        </aside>
      </div>

      {asignarKind && colaborador && (
        <AsignarModal
          kind={asignarKind}
          colaborador={colaborador}
          onClose={() => setAsignarKind(null)}
          onDone={() => { setAsignarKind(null); loadVigentes(); }}
        />
      )}
    </div>
  );
}
