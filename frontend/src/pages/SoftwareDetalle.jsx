import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, KeyRound, PackageX, Pencil, Plus, RotateCcw, Users } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import { InfoItem, InfoGroup } from '../components/ui/InfoItem.jsx';
import { SectionCard, EmptyState } from '../components/ui/SectionCard.jsx';
import { EstadoSoftwareBadge, EstadoLicenciaBadge, TipoSoftwareBadge } from '../components/licencias/LicenciaBadges.jsx';
import PuestosBar from '../components/licencias/PuestosBar.jsx';
import SoftwareForm from '../components/software/SoftwareForm.jsx';
import LicenciaForm from '../components/licencias/LicenciaForm.jsx';
import { useCan } from '../hooks/useCan';
import { useSubresource } from '../hooks/useSubresource';
import { useToast } from '../context/ToastContext.jsx';
import { softwareService } from '../services/softwareService';
import { formatDate } from '../utils/formatters';
import { ESTADOS_SOFTWARE } from '../utils/licenciasConfig';

export default function SoftwareDetalle() {
  const { id } = useParams();
  const toast = useToast();
  const can = useCan();
  const canGestionar = can('software.gestionar');
  const canVerLicencias = can('licencias.ver');
  const canGestionarLicencias = can('licencias.gestionar');

  const [software, setSoftware] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // El viewer no tiene 'licencias.ver' (traen costos): se evita la llamada, no solo se oculta la seccion.
  const vacio = () => Promise.resolve({ data: { licencias: [], usuarios: [] } });
  const licData = useSubresource(canVerLicencias ? softwareService.getLicencias : vacio, 'licencias', id, reloadKey);
  const usoData = useSubresource(canVerLicencias ? softwareService.getUsuarios : vacio, 'usuarios', id, reloadKey);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    softwareService.getById(id)
      .then((res) => !cancelled && setSoftware(res.data.software))
      .catch((err) => !cancelled && setError({ status: err.status, message: err.message }))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id, reloadKey]);

  const recargar = () => setReloadKey((k) => k + 1);
  const guardado = (s) => { setModal(null); setSoftware(s); };

  const toggleEstado = async () => {
    try {
      const nuevo = software.estado === 'activo' ? 'descontinuado' : 'activo';
      const res = await softwareService.setEstado(id, nuevo);
      toast.success(res.message);
      setSoftware(res.data.software);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const back = (
    <Link to="/software" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-500">
      <ArrowLeft size={16} /> Volver a software
    </Link>
  );

  if (loading && !software) {
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
          <h2 className="text-base font-semibold text-slate-800">{notFound ? 'Software no encontrado' : 'No se pudo cargar el software'}</h2>
          <p className="text-sm text-slate-500">{notFound ? 'Es posible que el registro ya no exista.' : error.message}</p>
          {!notFound && <Button variant="secondary" icon={RotateCcw} onClick={recargar}>Reintentar</Button>}
        </div>
      </div>
    );
  }

  const s = software;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {back}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h2 className="text-xl font-semibold text-slate-800">{s.nombre}</h2>
              <EstadoSoftwareBadge estado={s.estado} />
              <TipoSoftwareBadge tipo={s.tipo} />
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {s.fabricante?.nombre || 'Sin fabricante'}{s.categoria ? ` · ${s.categoria.nombre}` : ''}{s.version_referencia ? ` · v${s.version_referencia}` : ''}
            </p>
            {!s.requiere_licencia && <p className="mt-1 text-xs text-slate-400">No requiere licencia</p>}
            {canVerLicencias && s.licencias_total > 0 && (
              <div className="mt-3"><PuestosBar utilizadas={s.puestos_utilizados} total={s.puestos_total} /></div>
            )}
          </div>

          {canGestionar && (
            <div className="flex flex-wrap gap-2 sm:justify-end">
              {canGestionarLicencias && (
                <Button icon={Plus} onClick={() => setModal({ tipo: 'licencia' })}>Registrar licencia</Button>
              )}
              <Button variant="secondary" icon={Pencil} onClick={() => setModal({ tipo: 'software' })}>Editar</Button>
              <Button variant="secondary" onClick={toggleEstado}>
                {s.estado === 'activo' ? 'Descontinuar' : 'Reactivar'}
              </Button>
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-8 border-t border-slate-100 pt-6 md:grid-cols-2 lg:grid-cols-3">
          <InfoGroup title="Información general">
            <InfoItem label="Fabricante">{s.fabricante?.nombre}</InfoItem>
            <InfoItem label="Categoría">{s.categoria?.nombre}</InfoItem>
            <InfoItem label="Estado del catálogo">{ESTADOS_SOFTWARE[s.estado]?.label}</InfoItem>
            <InfoItem label="Requiere activación">{s.requiere_activacion ? 'Sí' : 'No'}</InfoItem>
            <InfoItem label="Sitio web" href={s.sitio_web ? `https://${s.sitio_web.replace(/^https?:\/\//, '')}` : undefined}>{s.sitio_web}</InfoItem>
          </InfoGroup>
          {(s.descripcion || s.observaciones) && (
            <InfoGroup title="Notas">
              <InfoItem label="Descripción" wide>{s.descripcion}</InfoItem>
              <InfoItem label="Observaciones" wide><span className="whitespace-pre-line">{s.observaciones}</span></InfoItem>
            </InfoGroup>
          )}
        </div>
      </section>

      {canVerLicencias && (
        <SectionCard
          title="Licencias"
          description="Contratos o compras de este software."
          count={licData.loading ? undefined : licData.items.length}
          action={<Link to={`/licencias?software_id=${s.id}`} className="text-sm font-medium text-brand-500 hover:underline">Ver todas</Link>}
        >
          {licData.loading ? (
            <div className="space-y-2 p-5">{[0, 1].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}</div>
          ) : licData.items.length === 0 ? (
            <EmptyState icon={KeyRound} message="Este software todavía no tiene licencias registradas." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {licData.items.map((l) => (
                <li key={l.id}>
                  <Link to={`/licencias/${l.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">{l.codigo} <span className="font-normal text-slate-500">· {l.modelo.nombre}</span></p>
                      <p className="text-xs text-slate-400">{l.fecha_vencimiento ? `Vence ${formatDate(l.fecha_vencimiento)}` : 'Sin vencimiento'}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <PuestosBar utilizadas={l.utilizadas} total={l.cantidad_total} size="sm" />
                      <EstadoLicenciaBadge estado={l.estado_efectivo} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      )}

      {canVerLicencias && (
        <SectionCard title="Usuarios" description="Quién usa hoy alguna licencia de este software." count={usoData.loading ? undefined : usoData.items.length}>
          {usoData.loading ? (
            <div className="space-y-2 p-5">{[0, 1].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}</div>
          ) : usoData.items.length === 0 ? (
            <EmptyState icon={Users} message="Nadie tiene un puesto asignado todavía." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {usoData.items.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    {u.colaborador ? (
                      <Link to={`/colaboradores/${u.colaborador.id}`} className="font-medium text-slate-800 hover:text-brand-500">{u.colaborador.nombre_completo}</Link>
                    ) : (
                      <Link to={`/equipos/${u.equipo.id}`} className="font-medium text-slate-800 hover:text-brand-500">{u.equipo.codigo_inventario}</Link>
                    )}
                    {u.colaborador && u.equipo && <p className="text-xs text-slate-400">{u.equipo.codigo_inventario} · {u.equipo.titulo}</p>}
                  </div>
                  <Link to={`/licencias/${u.licencia_id}`} className="shrink-0 text-xs font-medium text-slate-400 hover:text-brand-500">{u.licencia_codigo}</Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      )}

      {modal?.tipo === 'software' && <SoftwareForm software={s} onClose={() => setModal(null)} onSaved={guardado} />}
      {modal?.tipo === 'licencia' && (
        <LicenciaForm
          software={{ id: s.id, nombre: s.nombre, fabricante: s.fabricante }}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); recargar(); }}
        />
      )}
    </div>
  );
}
