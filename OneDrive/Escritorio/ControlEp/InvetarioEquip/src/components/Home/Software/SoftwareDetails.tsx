import React, { useState, useEffect } from "react";
import { FiEdit, FiTrash2, FiDownload, FiArrowLeft, FiPlus, FiMonitor } from "react-icons/fi";
import EquipoDetalle from "../Computo/EquipoDetalle";

interface Equipment {
  id: number;
  nombre: string;
  modelo: string;
  marca: string;
  tipo: string;
  estado: 'activo' | 'inactivo' | 'en_reparacion' | 'dado_de_baja';
  serial?: string;
  foto_equipo?: string;
  procesador?: string;
  ram?: string;
  almacenamiento?: string;
  sistema_operativo?: string;
  numero_serie?: string;
  fecha_adquisicion?: string;
  observaciones?: string;
  colaborador_id?: number | null;
  colaborador_nombre?: string | null;
}

interface License {
  id: string;
  clave_licencia: string;
  tipo_licencia: string;
  estado: string;
  fecha_adquisicion: string;
  fecha_caducidad: string;
  max_dispositivos: number;
  equipos: Equipment[];
  correo?: string;
  observaciones?: string;
}

interface SoftwareDetails {
  id: string;
  nombre: string;
  tipo: string;
  version: string;
  descripcion: string;
  licencias: License[];
}

interface SoftwareDetailsProps {
  softwareId: string;
  onBack: () => void;
  onEdit: (id: string) => void;
  onAddLicense: (softwareId: string) => void;
}

const SoftwareDetails: React.FC<SoftwareDetailsProps> = ({ 
  softwareId, 
  onBack,
  onEdit,
  onAddLicense
}) => {
  const [software, setSoftware] = useState<SoftwareDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'licenses'>('info');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  useEffect(() => {
    const fetchSoftwareDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${API_BASE_URL}/api/software/${softwareId}`);
        
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        const normalizeEquipment = (eq: any): Equipment => ({
          id: Number(eq.id),
          nombre: eq.nombre || `Equipo ${eq.id}`,
          modelo: eq.modelo || "N/A",
          marca: eq.marca || "N/A",
          tipo: eq.tipo || "desconocido",
          estado: eq.estado || "activo",
          serial: eq.serial || eq.numero_serie || "",
          foto_equipo: eq.foto_equipo || "",
          procesador: eq.procesador || "",
          ram: eq.ram || "",
          almacenamiento: eq.almacenamiento || "",
          sistema_operativo: eq.sistema_operativo || "",
          numero_serie: eq.numero_serie || "",
          fecha_adquisicion: eq.fecha_adquisicion || "",
          observaciones: eq.observaciones || "",
          colaborador_id: eq.colaborador_id ? Number(eq.colaborador_id) : null,
          colaborador_nombre: eq.colaborador_nombre || null
        });

        const normalizedData: SoftwareDetails = {
          id: data.id.toString(),
          nombre: data.nombre || "Sin nombre",
          tipo: data.tipo || "Sin tipo",
          version: data.version || "0.0.0",
          descripcion: data.descripcion || "",
          licencias: data.licencias?.map((lic: any) => ({
            id: lic.id.toString(),
            clave_licencia: lic.clave_licencia || "N/A",
            tipo_licencia: lic.tipo_licencia || "desconocido",
            estado: lic.estado || "no_asignada",
            fecha_adquisicion: lic.fecha_adquisicion,
            fecha_caducidad: lic.fecha_caducidad,
            max_dispositivos: lic.max_dispositivos || 1,
            correo: lic.correo || "",
            observaciones: lic.observaciones || "",
            equipos: lic.equipos?.map(normalizeEquipment) || []
          })) || []
        };

        setSoftware(normalizedData);
      } catch (err) {
        console.error("Error al obtener detalles:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
        setSoftware(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSoftwareDetails();
  }, [softwareId, API_BASE_URL]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
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

  const handleDeleteLicense = async (licenseId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta licencia?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/licencias/${licenseId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la licencia');
      }

      if (software) {
        setSoftware({
          ...software,
          licencias: software.licencias.filter(lic => lic.id !== licenseId)
        });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const handleDownloadReport = () => {
    alert('Descargando reporte...');
  };

  const handleEquipmentClick = (equipment: Equipment) => {
    if (!equipment) {
      console.error("El equipo está vacío");
      return;
    }
    
    // Validar campos mínimos requeridos
    const equipoCompleto: Equipment = {
      ...equipment,
      nombre: equipment.nombre || `Equipo ${equipment.id}`,
      modelo: equipment.modelo || "N/A",
      marca: equipment.marca || "N/A",
      tipo: equipment.tipo || "desconocido",
      estado: equipment.estado || "activo"
    };
    
    setSelectedEquipment(equipoCompleto);
  };

  const handleBackFromEquipment = () => {
    setSelectedEquipment(null);
  };

  if (selectedEquipment) {
    return (
      <EquipoDetalle 
        equipo={selectedEquipment} 
        onBack={handleBackFromEquipment}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Cargando detalles del software...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 max-w-3xl mx-auto">
        <div className="text-red-500 font-medium text-lg mb-4">Error al cargar los detalles</div>
        <p className="mb-6 text-gray-700">{error}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <FiArrowLeft className="mr-2" />
          Volver al listado
        </button>
      </div>
    );
  }

  if (!software) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 max-w-3xl mx-auto">
        <p className="mb-6 text-gray-700">No se encontró información para este software</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <FiArrowLeft className="mr-2" />
          Volver al listado
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden max-w-6xl mx-auto mb-8">
      {/* Header con acciones */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold">{software.nombre}</h1>
            <p className="text-blue-100">
              {software.tipo} | Versión: {software.version}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onBack}
              className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors flex items-center"
            >
              <FiArrowLeft className="mr-2" />
              Volver
            </button>
            <button
              onClick={() => onEdit(software.id)}
              className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors flex items-center"
            >
              <FiEdit className="mr-2" />
              Editar
            </button>
            <button
              onClick={handleDownloadReport}
              className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors flex items-center"
            >
              <FiDownload className="mr-2" />
              Reporte
            </button>
          </div>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'info' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Información General
          </button>
          <button
            onClick={() => setActiveTab('licenses')}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'licenses' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Licencias ({software.licencias.length})
          </button>
        </nav>
      </div>

      {/* Contenido de los tabs */}
      <div className="p-6">
        {activeTab === 'info' && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Descripción</h2>
              <p className="text-gray-700">
                {software.descripcion || "No hay descripción disponible"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-medium text-gray-500 mb-2">Tipo</h3>
                <p className="text-lg">{software.tipo}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-medium text-gray-500 mb-2">Versión</h3>
                <p className="text-lg">{software.version}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-medium text-gray-500 mb-2">Licencias</h3>
                <p className="text-lg">{software.licencias.length}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'licenses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Licencias del Software</h2>
              <button
                onClick={() => onAddLicense(software.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <FiPlus className="mr-2" />
                Agregar Licencia
              </button>
            </div>

            {software.licencias.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-500">No hay licencias registradas para este software</p>
                <button
                  onClick={() => onAddLicense(software.id)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
                >
                  <FiPlus className="mr-2" />
                  Agregar Primera Licencia
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {software.licencias.map((licencia) => (
                  <div key={licencia.id} className="border rounded-xl overflow-hidden transition-all hover:shadow-md">
                    <div className={`p-4 ${licencia.estado === 'activa' ? 'bg-green-50' : licencia.estado === 'caducada' ? 'bg-red-50' : 'bg-yellow-50'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-lg text-gray-800">
                            {licencia.clave_licencia}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {licencia.tipo_licencia}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              licencia.estado === 'activa' 
                                ? 'bg-green-100 text-green-800' 
                                : licencia.estado === 'caducada' 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {licencia.estado}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {/* Implementar edición de licencia */}}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            title="Editar licencia"
                          >
                            <FiEdit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteLicense(licencia.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Eliminar licencia"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Fechas</h4>
                          <p className="text-sm">
                            <span className="font-medium">Adquisición:</span> {formatDate(licencia.fecha_adquisicion)}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Caducidad:</span> {formatDate(licencia.fecha_caducidad)}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Dispositivos</h4>
                          <p className="text-sm">
                            Máximos: {licencia.max_dispositivos}
                          </p>
                          <p className="text-sm">
                            Asignados: {licencia.equipos.length}
                          </p>
                        </div>

                        {(licencia.correo || licencia.observaciones) && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Contacto</h4>
                            {licencia.correo && (
                              <p className="text-sm truncate" title={licencia.correo}>
                                {licencia.correo}
                              </p>
                            )}
                            {licencia.observaciones && (
                              <p className="text-sm text-gray-600 truncate" title={licencia.observaciones}>
                                {licencia.observaciones}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {licencia.equipos.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="text-sm font-medium text-gray-500 mb-2">
                            Equipos asociados ({licencia.equipos.length})
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {licencia.equipos.map((equipo) => (
                              <button
                                key={equipo.id} 
                                className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full hover:bg-gray-200 transition-colors flex items-center gap-1"
                                title={`Marca: ${equipo.marca}\nModelo: ${equipo.modelo}\nSerial: ${equipo.serial}`}
                                onClick={() => handleEquipmentClick(equipo)}
                              >
                                <FiMonitor className="text-blue-500" />
                                <span>{equipo.nombre}</span>
                                {equipo.estado !== 'activo' && (
                                  <span className={`text-xs px-1 rounded ${
                                    equipo.estado === 'inactivo' ? 'bg-gray-200' : 
                                    equipo.estado === 'en_reparacion' ? 'bg-yellow-100' : 
                                    'bg-red-100'
                                  }`}>
                                    {equipo.estado}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SoftwareDetails;