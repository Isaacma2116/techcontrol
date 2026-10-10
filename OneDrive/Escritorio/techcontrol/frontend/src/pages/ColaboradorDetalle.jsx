import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileSignature, Pencil, UserX, AlertCircle, RotateCcw } from 'lucide-react';
import Avatar from '../components/ui/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import { EstadoBadge } from '../components/ui/Badge.jsx';
import { InfoItem, InfoGroup } from '../components/ui/InfoItem.jsx';
import ColaboradorForm from '../components/colaboradores/ColaboradorForm.jsx';
import ItemsAsignados from '../components/colaboradores/ItemsAsignados.jsx';
import AsignarModal from '../components/inventario/AsignarModal.jsx';
import DevolverModal from '../components/inventario/DevolverModal.jsx';
import HistorialAsignaciones from '../components/colaboradores/HistorialAsignaciones.jsx';
import { colaboradorService, fotoUrl } from '../services/colaboradorService';
import { useSubresource } from '../hooks/useSubresource';
import { useCanManage } from '../hooks/useCanManage';
import { formatDate } from '../utils/formatters';

export default function ColaboradorDetalle() {
  const { id } = useParams();
  const [colaborador, setColaborador] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // { status, message }
  const [editing, setEditing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [asignar, setAsignar] = useState(null); // 'equipos' | 'accesorios' | 'impresoras' | 'celulares' | null
  const [devolver, setDevolver] = useState(null); // { kind, item } | null
  const canManage = useCanManage();

  const equipos = useSubresource(colaboradorService.getEquipos, 'equipos', id, reloadKey);
  const accesorios = useSubresource(colaboradorService.getAccesorios, 'accesorios', id, reloadKey);
  const impresoras = useSubresource(colaboradorService.getImpresoras, 'impresoras', id, reloadKey);
  const celulares = useSubresource(colaboradorService.getCelulares, 'celulares', id, reloadKey);
  const historial = useSubresource(colaboradorService.getHistorial, 'historial', id, reloadKey);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    colaboradorService
      .getById(id)
      .then((res) => !cancelled && setColaborador(res.data.colaborador))
      .catch((err) => !cancelled && setError({ status: err.status, message: err.message }))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => load(), [load, reloadKey]);

  // Tras asignar/devolver se recargan las listas y el colaborador (sus contadores).
  const refreshAll = () => setReloadKey((k) => k + 1);

  const back = (
    <Link to="/colaboradores" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-500">
      <ArrowLeft size={16} /> Volver a colaboradores
    </Link>
  );

  if (loading && !colaborador) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        {back}
        <div className="h-36 animate-pulse rounded-xl border border-slate-200 bg-white" />
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
          {notFound ? <UserX size={28} className="text-slate-400" /> : <AlertCircle size={28} className="text-red-500" />}
          <h2 className="text-base font-semibold text-slate-800">
            {notFound ? 'Colaborador no encontrado' : 'No se pudo cargar el perfil'}
          </h2>
          <p className="text-sm text-slate-500">{notFound ? 'Es posible que el registro ya no exista.' : error.message}</p>
          {!notFound && (
            <Button variant="secondary" icon={RotateCcw} onClick={() => setReloadKey((k) => k + 1)}>
              Reintentar
            </Button>
          )}
        </div>
      </div>
    );
  }

  const c = colaborador;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {back}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar src={fotoUrl(c.fotografia)} nombre={c.nombre} apellido={c.apellido_paterno} size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h2 className="text-xl font-semibold text-slate-800">{c.nombre_completo}</h2>
              <EstadoBadge activo={c.activo} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {c.cargo} · {c.area}
            </p>
            <p className="mt-0.5 text-sm text-slate-400">ID de empleado: {c.id_empleado}</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:self-start">
            {c.activo && (
              <Link
                to={`/cartas-responsivas/nueva?colaborador=${c.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <FileSignature size={16} /> Generar carta
              </Link>
            )}
            <Button variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>
              Editar
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-8 border-t border-slate-100 pt-6 lg:grid-cols-3">
          <InfoGroup title="Información general">
            <InfoItem label="ID de empleado">{c.id_empleado}</InfoItem>
            <InfoItem label="Estado">{c.activo ? 'Activo' : 'Inactivo'}</InfoItem>
            <InfoItem label="Fecha de ingreso">{formatDate(c.fecha_alta)}</InfoItem>
            {!c.activo && <InfoItem label="Fecha de baja">{formatDate(c.fecha_baja)}</InfoItem>}
          </InfoGroup>

          <InfoGroup title="Información laboral">
            <InfoItem label="Área">{c.area}</InfoItem>
            <InfoItem label="Cargo">{c.cargo}</InfoItem>
            <InfoItem wide label="Correo empresarial" href={c.correo_empresarial && `mailto:${c.correo_empresarial}`}>
              {c.correo_empresarial}
            </InfoItem>
            <InfoItem wide label="Teléfono empresarial" href={c.telefono_empresarial && `tel:${c.telefono_empresarial}`}>
              {c.telefono_empresarial}
            </InfoItem>
          </InfoGroup>

          <InfoGroup title="Contacto personal">
            <InfoItem wide label="Correo personal" href={c.correo_personal && `mailto:${c.correo_personal}`}>
              {c.correo_personal}
            </InfoItem>
            <InfoItem wide label="Teléfono personal" href={c.telefono_personal && `tel:${c.telefono_personal}`}>
              {c.telefono_personal}
            </InfoItem>
          </InfoGroup>
        </div>
      </section>

      {/* Asignar / devolver solo si el colaborador esta activo (a un inactivo no se le asigna nada). */}
      <ItemsAsignados
        kind="equipos"
        items={equipos.items}
        loading={equipos.loading}
        error={equipos.error}
        onAsignar={canManage && c.activo ? () => setAsignar('equipos') : undefined}
        onDevolver={(item) => setDevolver({ kind: 'equipos', item })}
      />
      <ItemsAsignados
        kind="accesorios"
        items={accesorios.items}
        loading={accesorios.loading}
        error={accesorios.error}
        onAsignar={canManage && c.activo ? () => setAsignar('accesorios') : undefined}
        onDevolver={(item) => setDevolver({ kind: 'accesorios', item })}
      />
      <ItemsAsignados
        kind="impresoras"
        items={impresoras.items}
        loading={impresoras.loading}
        error={impresoras.error}
        onAsignar={canManage && c.activo ? () => setAsignar('impresoras') : undefined}
        onDevolver={(item) => setDevolver({ kind: 'impresoras', item })}
      />
      <ItemsAsignados
        kind="celulares"
        items={celulares.items}
        loading={celulares.loading}
        error={celulares.error}
        onAsignar={canManage && c.activo ? () => setAsignar('celulares') : undefined}
        onDevolver={(item) => setDevolver({ kind: 'celulares', item })}
      />
      <HistorialAsignaciones historial={historial.items} loading={historial.loading} error={historial.error} />

      {asignar && (
        <AsignarModal
          kind={asignar}
          colaborador={c}
          onClose={() => setAsignar(null)}
          onDone={() => {
            setAsignar(null);
            refreshAll();
          }}
        />
      )}
      {devolver && (
        <DevolverModal
          kind={devolver.kind}
          asignacionId={devolver.item.asignacion_id}
          itemLabel={`${devolver.item.codigo_inventario} · ${devolver.item.tipo}`}
          colaboradorLabel={c.nombre_completo}
          onClose={() => setDevolver(null)}
          onDone={() => {
            setDevolver(null);
            refreshAll();
          }}
        />
      )}

      {editing && (
        <ColaboradorForm
          colaborador={c}
          onClose={() => setEditing(false)}
          onSaved={(saved) => {
            setEditing(false);
            setColaborador(saved);
          }}
        />
      )}
    </div>
  );
}
