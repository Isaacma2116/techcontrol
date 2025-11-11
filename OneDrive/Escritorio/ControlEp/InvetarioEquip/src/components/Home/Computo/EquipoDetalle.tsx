import React, { useEffect, useState } from "react";
import { FiEdit, FiTrash2, FiArrowLeft, FiUser, FiPhone, FiMail, FiMonitor } from "react-icons/fi";

interface Equipo {
  id: number;
  nombre: string;
  marca: string;
  modelo: string;
  tipo: string;
  estado: 'activo' | 'inactivo' | 'en_reparacion' | 'dado_de_baja';
  foto_equipo?: string;
  procesador?: string;
  ram?: string;
  almacenamiento?: string;
  sistema_operativo?: string;
  numero_serie?: string;
  serial?: string;
  fecha_adquisicion?: string;
  observaciones?: string;
  colaborador_id?: number | null;
  colaborador_nombre?: string | null;
  colaborador_email?: string;
  colaborador_telefono?: string;
}

interface EquipoDetalleProps {
  equipo: Equipo;
  onBack: () => void;
  onUpdate?: (updated: Partial<Equipo>) => Promise<void>;
  onReasignar?: (colaboradorId: number | null) => Promise<void>;
}

const BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;

const estadoStyles = {
  activo: {
    color: "bg-green-100 text-green-800",
    icon: (
      <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <circle cx="12" cy="12" r="10" strokeWidth="2" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  inactivo: {
    color: "bg-gray-100 text-gray-800",
    icon: (
      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <circle cx="12" cy="12" r="10" strokeWidth="2" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 9l-6 6M9 9l6 6" />
      </svg>
    ),
  },
  en_reparacion: {
    color: "bg-yellow-100 text-yellow-800",
    icon: (
      <svg className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <circle cx="12" cy="12" r="10" strokeWidth="2" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01" />
      </svg>
    ),
  },
  dado_de_baja: {
    color: "bg-red-100 text-red-800",
    icon: (
      <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <circle cx="12" cy="12" r="10" strokeWidth="2" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 9l-6 6M9 9l6 6" />
      </svg>
    ),
  },
};

const getFotoEquipoUrl = (foto_equipo?: string) => {
  if (!foto_equipo) return "/placeholder-equipo.png";
  if (/^https?:\/\//.test(foto_equipo)) return foto_equipo;
  if (foto_equipo.startsWith("/uploads")) {
    return BASE_URL.replace(/\/$/, "") + foto_equipo;
  }
  return foto_equipo;
};

const EquipoDetalle: React.FC<EquipoDetalleProps> = ({
  equipo,
  onBack,
  onUpdate,
  onReasignar,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [reasignarMode, setReasignarMode] = useState(false);
  const [form, setForm] = useState<Equipo>({ ...equipo });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [loadingColab, setLoadingColab] = useState(false);
  const [colabError, setColabError] = useState<string | null>(null);
  const [reasignarId, setReasignarId] = useState<number | null>(equipo.colaborador_id ?? null);

  // Cargar lista de colaboradores
  useEffect(() => {
    const fetchColaboradores = async () => {
      setLoadingColab(true);
      setColabError(null);
      try {
        const response = await fetch(`${BASE_URL}/api/colaboradores`);
        if (!response.ok) throw new Error("Error al cargar colaboradores");
        const data = await response.json();
        setColaboradores(Array.isArray(data) ? data : data.data || []);
      } catch (err) {
        setColabError("No se pudieron cargar los colaboradores");
      } finally {
        setLoadingColab(false);
      }
    };

    fetchColaboradores();
  }, []);

  // Actualizar formulario cuando cambia el equipo
  useEffect(() => {
    setForm({ ...equipo });
    setReasignarId(equipo.colaborador_id ?? null);
  }, [equipo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (onUpdate) {
        await onUpdate(form);
      } else {
        const response = await fetch(`${BASE_URL}/api/equipos/${equipo.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!response.ok) throw new Error("Error al actualizar equipo");
      }
      setEditMode(false);
      setSuccess("Equipo actualizado correctamente");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  const handleReasignar = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (onReasignar) {
        await onReasignar(reasignarId);
      } else {
        const response = await fetch(`${BASE_URL}/api/equipos/${equipo.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ colaborador_id: reasignarId }),
        });
        if (!response.ok) throw new Error("Error al reasignar equipo");
      }
      setReasignarMode(false);
      setSuccess("Equipo reasignado correctamente");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No especificada';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const estado = equipo.estado in estadoStyles 
    ? estadoStyles[equipo.estado] 
    : {
        color: "bg-gray-100 text-gray-800",
        icon: (
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
          </svg>
        ),
      };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6"
      >
        <FiArrowLeft className="inline" /> Volver
      </button>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl font-bold">
                {editMode ? (
                  <input
                    name="nombre"
                    value={form.nombre || ''}
                    onChange={handleInputChange}
                    className="bg-white/20 rounded px-2 py-1 w-full"
                    placeholder="Nombre del equipo"
                  />
                ) : (
                  equipo.nombre || `${equipo.marca} ${equipo.modelo}`
                )}
              </h1>
              <p className="text-blue-100">
                {equipo.tipo} • {equipo.modelo}
              </p>
            </div>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${estado.color}`}>
              {estado.icon}
              {equipo.estado?.toUpperCase() || 'DESCONOCIDO'}
            </span>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="p-6 flex flex-col md:flex-row gap-8">
          {/* Columna izquierda - Foto */}
          <div className="w-full md:w-1/3">
            <div className="bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center aspect-square">
              <img
                src={getFotoEquipoUrl(equipo.foto_equipo)}
                alt={`${equipo.marca} ${equipo.modelo}`}
                className="object-contain w-full h-full"
                crossOrigin="anonymous"
              />
            </div>
          </div>

          {/* Columna derecha - Detalles */}
          <div className="w-full md:w-2/3">
            {/* Mensajes de estado */}
            {(error || success) && (
              <div className={`mb-4 p-3 rounded ${error ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                {error || success}
              </div>
            )}

            {/* Especificaciones técnicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">Marca</label>
                {editMode ? (
                  <input
                    name="marca"
                    value={form.marca || ''}
                    onChange={handleInputChange}
                    className="border rounded p-2 w-full"
                  />
                ) : (
                  <p className="font-medium">{equipo.marca || 'No especificada'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Modelo</label>
                {editMode ? (
                  <input
                    name="modelo"
                    value={form.modelo || ''}
                    onChange={handleInputChange}
                    className="border rounded p-2 w-full"
                  />
                ) : (
                  <p className="font-medium">{equipo.modelo || 'No especificado'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Procesador</label>
                {editMode ? (
                  <input
                    name="procesador"
                    value={form.procesador || ''}
                    onChange={handleInputChange}
                    className="border rounded p-2 w-full"
                  />
                ) : (
                  <p className="font-medium">{equipo.procesador || 'No especificado'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">RAM</label>
                {editMode ? (
                  <input
                    name="ram"
                    value={form.ram || ''}
                    onChange={handleInputChange}
                    className="border rounded p-2 w-full"
                  />
                ) : (
                  <p className="font-medium">{equipo.ram || 'No especificada'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Almacenamiento</label>
                {editMode ? (
                  <input
                    name="almacenamiento"
                    value={form.almacenamiento || ''}
                    onChange={handleInputChange}
                    className="border rounded p-2 w-full"
                  />
                ) : (
                  <p className="font-medium">{equipo.almacenamiento || 'No especificado'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Sistema Operativo</label>
                {editMode ? (
                  <input
                    name="sistema_operativo"
                    value={form.sistema_operativo || ''}
                    onChange={handleInputChange}
                    className="border rounded p-2 w-full"
                  />
                ) : (
                  <p className="font-medium">{equipo.sistema_operativo || 'No especificado'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Número de Serie</label>
                {editMode ? (
                  <input
                    name="numero_serie"
                    value={form.numero_serie || ''}
                    onChange={handleInputChange}
                    className="border rounded p-2 w-full"
                  />
                ) : (
                  <p className="font-medium">{equipo.numero_serie || equipo.serial || 'No especificado'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Fecha de Adquisición</label>
                {editMode ? (
                  <input
                    type="date"
                    name="fecha_adquisicion"
                    value={form.fecha_adquisicion || ''}
                    onChange={handleInputChange}
                    className="border rounded p-2 w-full"
                  />
                ) : (
                  <p className="font-medium">{formatDate(equipo.fecha_adquisicion)}</p>
                )}
              </div>
            </div>

            {/* Observaciones */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-500">Observaciones</label>
              {editMode ? (
                <textarea
                  name="observaciones"
                  value={form.observaciones || ''}
                  onChange={handleInputChange}
                  className="border rounded p-2 w-full h-24"
                />
              ) : (
                <div className="bg-gray-50 p-4 rounded">
                  <p className="font-medium">{equipo.observaciones || 'Sin observaciones'}</p>
                </div>
              )}
            </div>

            {/* Colaborador asignado */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-500">Colaborador asignado</label>
              {reasignarMode ? (
                <div>
                  <select
                    value={reasignarId || ''}
                    onChange={(e) => setReasignarId(e.target.value ? Number(e.target.value) : null)}
                    className="border rounded p-2 w-full"
                    disabled={loadingColab || saving}
                  >
                    <option value="">-- Sin asignar --</option>
                    {colaboradores.map(colab => (
                      <option key={colab.id} value={colab.id}>
                        {colab.nombre}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleReasignar}
                      disabled={saving || loadingColab}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                      onClick={() => setReasignarMode(false)}
                      disabled={saving}
                      className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded flex items-center gap-3">
                  {equipo.colaborador_id ? (
                    <>
                      <div className="bg-blue-100 p-2 rounded-full">
                        <FiUser className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{equipo.colaborador_nombre}</p>
                        {equipo.colaborador_email && (
                          <p className="text-sm flex items-center gap-1 text-gray-600">
                            <FiMail /> {equipo.colaborador_email}
                          </p>
                        )}
                        {equipo.colaborador_telefono && (
                          <p className="text-sm flex items-center gap-1 text-gray-600">
                            <FiPhone /> {equipo.colaborador_telefono}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500 italic">Ningún colaborador asignado</p>
                  )}
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="flex flex-wrap gap-3">
              {editMode ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
                  >
                    <FiEdit /> Guardar cambios
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    disabled={saving}
                    className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 flex items-center gap-2"
                  >
                    Cancelar
                  </button>
                </>
              ) : reasignarMode ? null : (
                <>
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                  >
                    <FiEdit /> Editar información
                  </button>
                  <button
                    onClick={() => setReasignarMode(true)}
                    className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 flex items-center gap-2"
                  >
                    <FiUser /> Reasignar equipo
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipoDetalle;