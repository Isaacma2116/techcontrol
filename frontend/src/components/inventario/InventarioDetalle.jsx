import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Repeat, PackageX, AlertCircle, RotateCcw } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { InfoItem, InfoGroup } from '../ui/InfoItem.jsx';
import ItemThumb from './ItemThumb.jsx';
import EstadoInventarioBadge from './EstadoInventarioBadge.jsx';
import AsignacionActual from './AsignacionActual.jsx';
import HistorialAsignacionesItem from './HistorialAsignacionesItem.jsx';
import MantenimientosUnidad from '../mantenimientos/MantenimientosUnidad.jsx';
import { FORMS } from './inventarioForms.js';
import AsignarModal from './AsignarModal.jsx';
import DevolverModal from './DevolverModal.jsx';
import CambiarEstadoModal from './CambiarEstadoModal.jsx';
import { useCanManage } from '../../hooks/useCanManage';
import { useSubresource } from '../../hooks/useSubresource';
import { imagenUrl, inventarioServices } from '../../services/inventarioService';
import { KINDS } from '../../utils/inventarioConfig';

/**
 * Detalle generico de un equipo/accesorio/impresora/celular
 * (kind = 'equipos' | 'accesorios' | 'impresoras' | 'celulares').
 * `sections(item)` describe la ficha: [{ title, items: [{ label, value, wide? }] }].
 * Incluye asignacion actual (asignar / devolver), cambio de estado, edicion e historial.
 */
export default function InventarioDetalle({ kind, sections }) {
  const cfg = KINDS[kind];
  const service = inventarioServices[kind];
  const { id } = useParams();
  const canManage = useCanManage();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // { status, message }
  const [modal, setModal] = useState(null); // 'editar' | 'asignar' | 'devolver' | 'estado'
  const [reloadKey, setReloadKey] = useState(0);

  const historial = useSubresource(service.getHistorial, 'historial', id, reloadKey);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    service
      .getById(id)
      .then((res) => !cancelled && setItem(res.data.item))
      .catch((err) => !cancelled && setError({ status: err.status, message: err.message }))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, kind, reloadKey]);

  // Tras editar / asignar / devolver / cambiar estado: se muestra el item actualizado y se refresca el historial.
  const done = (updated) => {
    setModal(null);
    if (updated) setItem(updated);
    setReloadKey((k) => k + 1);
  };

  const back = (
    <Link to={cfg.basePath} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-500">
      <ArrowLeft size={16} /> Volver a {cfg.plural}
    </Link>
  );

  if (loading && !item) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        {back}
        <div className="h-40 animate-pulse rounded-xl border border-slate-200 bg-white" />
        <div className="h-56 animate-pulse rounded-xl border border-slate-200 bg-white" />
      </div>
    );
  }

  if (error) {
    const notFound = error.status === 404 || error.status === 400;
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        {back}
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          {notFound ? <PackageX size={28} className="text-slate-400" /> : <AlertCircle size={28} className="text-red-500" />}
          <h2 className="text-base font-semibold text-slate-800">
            {notFound ? `${cfg.Singular} no encontrad${cfg.o}` : `No se pudo cargar ${cfg.el} ${cfg.singular}`}
          </h2>
          <p className="text-sm text-slate-500">{notFound ? 'Es posible que el registro ya no exista.' : error.message}</p>
          {!notFound && (
            <Button variant="secondary" icon={RotateCcw} onClick={() => setReloadKey((k) => k + 1)}>Reintentar</Button>
          )}
        </div>
      </div>
    );
  }

  const actual = item.asignacion_actual;
  const { Form, prop: formPropName } = FORMS[kind];
  const formProp = { [formPropName]: item };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {back}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <ItemThumb kind={kind} src={imagenUrl(kind, item.imagen)} size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h2 className="text-xl font-semibold text-slate-800">{item.codigo_inventario}</h2>
              <EstadoInventarioBadge estado={item.estado} />
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {cfg.byMarca ? [item.tipo, item.marca, item.modelo].filter(Boolean).join(' · ') : `${item.titulo} · ${item.tipo}`}
            </p>
            <p className="mt-0.5 text-sm text-slate-400">
              {item.numero_serie ? `Serie: ${item.numero_serie}` : 'Sin número de serie'}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {actual ? `Con ${actual.nombre_completo}` : 'Sin colaborador'}
            </p>
          </div>
          {canManage && (
            <div className="flex flex-col gap-2 sm:self-start">
              <Button variant="secondary" icon={Pencil} onClick={() => setModal('editar')}>Editar</Button>
              <Button
                variant="secondary"
                icon={Repeat}
                onClick={() => setModal('estado')}
                disabled={item.estado === 'asignado'}
                title={item.estado === 'asignado' ? `Devuelve ${cfg.el} ${cfg.singular} antes de cambiar su estado` : undefined}
              >
                Cambiar estado
              </Button>
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-8 border-t border-slate-100 pt-6 md:grid-cols-2 lg:grid-cols-3">
          {sections(item).map((section) => (
            <InfoGroup key={section.title} title={section.title}>
              {section.items.map((it) => (
                <InfoItem key={it.label} label={it.label} wide={it.wide} href={it.href}>
                  {it.value}
                </InfoItem>
              ))}
            </InfoGroup>
          ))}
        </div>
      </section>

      <AsignacionActual
        kind={kind}
        item={item}
        canManage={canManage}
        onAsignar={() => setModal('asignar')}
        onDevolver={() => setModal('devolver')}
      />
      <MantenimientosUnidad kind={kind} item={item} canManage={canManage} />
      <HistorialAsignacionesItem
        historial={historial.items}
        loading={historial.loading}
        error={historial.error}
        canManage={canManage}
      />

      {modal === 'editar' && <Form {...formProp} onClose={() => setModal(null)} onSaved={done} />}
      {modal === 'estado' && <CambiarEstadoModal kind={kind} item={item} onClose={() => setModal(null)} onDone={done} />}
      {modal === 'asignar' && <AsignarModal kind={kind} item={item} onClose={() => setModal(null)} onDone={done} />}
      {modal === 'devolver' && actual && (
        <DevolverModal
          kind={kind}
          asignacionId={actual.id}
          itemLabel={`${item.codigo_inventario} · ${item.titulo || item.tipo}`}
          colaboradorLabel={actual.nombre_completo}
          onClose={() => setModal(null)}
          onDone={done}
        />
      )}
    </div>
  );
}
