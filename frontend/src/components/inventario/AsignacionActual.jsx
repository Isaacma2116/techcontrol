import { Link } from 'react-router-dom';
import { UserPlus, Undo2, UserX } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import Button from '../ui/Button.jsx';
import { InfoItem } from '../ui/InfoItem.jsx';
import { SectionCard } from '../ui/SectionCard.jsx';
import { fotoUrl } from '../../services/colaboradorService';
import { KINDS } from '../../utils/inventarioConfig';
import { formatDate } from '../../utils/formatters';

/**
 * Quien tiene HOY el equipo/accesorio/impresora/celular (asignacion vigente) o, si no la hay,
 * "Sin asignar". Desde aqui se asigna o se devuelve.
 */
export default function AsignacionActual({ kind, item, canManage, onAsignar, onDevolver }) {
  const cfg = KINDS[kind];
  const actual = item.asignacion_actual;
  const Este = `${cfg.este[0].toUpperCase()}${cfg.este.slice(1)}`;

  return (
    <SectionCard
      title="Asignación actual"
      action={
        canManage &&
        (actual ? (
          <Button variant="secondary" icon={Undo2} onClick={onDevolver}>
            Devolver {cfg.singular}
          </Button>
        ) : (
          item.estado === 'disponible' && (
            <Button icon={UserPlus} onClick={onAsignar}>
              Asignar {cfg.singular}
            </Button>
          )
        ))
      }
    >
      {actual ? (
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start">
          <div className="flex items-center gap-3 sm:w-72">
            <Avatar src={fotoUrl(actual.fotografia)} nombre={actual.nombre_completo.split(' ')[0]} apellido={actual.nombre_completo.split(' ')[1]} size="lg" />
            <div className="min-w-0">
              {canManage ? (
                <Link to={`/colaboradores/${actual.colaborador_id}`} className="font-semibold text-slate-800 hover:text-brand-500">
                  {actual.nombre_completo}
                </Link>
              ) : (
                <p className="font-semibold text-slate-800">{actual.nombre_completo}</p>
              )}
              <p className="text-sm text-slate-500">{actual.id_empleado} · {actual.area}</p>
            </div>
          </div>
          <dl className="grid flex-1 grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <InfoItem label="Fecha de asignación">{formatDate(actual.fecha_asignacion)}</InfoItem>
            <InfoItem label="Asignado por">{actual.asignado_por}</InfoItem>
            <InfoItem label="Observaciones" wide>{actual.observaciones_asignacion}</InfoItem>
          </dl>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
          <UserX size={28} className="text-slate-300" />
          <p className="font-medium text-slate-700">Sin colaborador</p>
          <p className="text-sm text-slate-500">
            {item.estado === 'disponible'
              ? `${Este} ${cfg.singular} está disponible para asignarse.`
              : `${Este} ${cfg.singular} no se puede asignar mientras su estado no sea Disponible.`}
          </p>
        </div>
      )}
    </SectionCard>
  );
}
