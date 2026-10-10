import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Select, Input } from '../ui/FormField.jsx';
import { catalogoService } from '../../services/colaboradorService';
import { ESTADOS_ACTIVO, TIPO_ACTIVO_LABEL } from '../../utils/reportesConfig';

/**
 * Filtros globales de Reportes: una sola fila arriba de todo, que alcanza a
 * cada tarjeta y cada grafico (todos leen la misma URL). Periodo primero.
 */
export default function FiltrosReporte({ filtros, onChange }) {
  const [areas, setAreas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const activos = ['desde', 'hasta', 'departamento_id', 'ubicacion_id', 'tipo_activo', 'estado'].filter((k) => filtros[k]).length;

  useEffect(() => {
    catalogoService.list('areas').then((res) => setAreas(res.data.items)).catch(() => {});
    catalogoService.list('ubicaciones').then((res) => setUbicaciones(res.data.items)).catch(() => {});
  }, []);

  const campo = (label, children) => (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {campo('Desde', <Input type="date" value={filtros.desde} onChange={(e) => onChange({ desde: e.target.value })} />)}
        {campo('Hasta', <Input type="date" value={filtros.hasta} onChange={(e) => onChange({ hasta: e.target.value })} />)}
        {campo('Departamento', (
          <Select value={filtros.departamento_id} onChange={(e) => onChange({ departamento_id: e.target.value })}>
            <option value="">Todos</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </Select>
        ))}
        {campo('Ubicación', (
          <Select value={filtros.ubicacion_id} onChange={(e) => onChange({ ubicacion_id: e.target.value })}>
            <option value="">Todas</option>
            {ubicaciones.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
          </Select>
        ))}
        {campo('Tipo de activo', (
          <Select value={filtros.tipo_activo} onChange={(e) => onChange({ tipo_activo: e.target.value })}>
            <option value="">Todos</option>
            {Object.entries(TIPO_ACTIVO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        ))}
        {campo('Estado', (
          <Select value={filtros.estado} onChange={(e) => onChange({ estado: e.target.value })}>
            <option value="">Todos</option>
            {Object.entries(ESTADOS_ACTIVO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        ))}
      </div>

      {activos > 0 && (
        <button
          type="button"
          onClick={() => onChange({ desde: '', hasta: '', departamento_id: '', ubicacion_id: '', tipo_activo: '', estado: '' })}
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-brand-500"
        >
          <X size={14} /> Quitar filtros
        </button>
      )}
    </section>
  );
}
