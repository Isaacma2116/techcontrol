import React, { useEffect, useState } from "react";
import SoftwareList from "./SoftwareList";
import SoftwareForm from "./SoftwareForm";
import SoftwareDetails from "./SoftwareDetails";
import SoftwareAnalytics from "./SoftwareAnalytics";
import { FiPlus, FiRefreshCw, FiAlertCircle, FiBarChart2 } from "react-icons/fi";

interface Software {
  id: string;
  nombre: string;
  tipo: string;
  version: string;
  licencias_totales: number;
  licencias_activas: number;
  licencias_caducadas: number;
  criticidad?: 'alta' | 'media' | 'baja';
  ultima_actualizacion?: string;
  proveedor?: string;
  fecha_instalacion?: string;
  fecha_caducidad?: string;
  costo_licencia?: number;
  frecuencia_uso?: 'diario' | 'semanal' | 'mensual' | 'ocasional';
  departamentos_utilizan?: string[];
  requiere_actualizacion?: boolean;
  soporte_activo?: boolean;
  documentacion_disponible?: boolean;
  en_cloud?: boolean;
  requisitos_tecnicos?: {
    ram_minima?: number;
    almacenamiento?: number;
    so_compatibles?: string[];
  };
}

const SoftwareContent: React.FC = () => {
  const [softwareData, setSoftwareData] = useState<Software[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSoftwareId, setSelectedSoftwareId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  // Función para consolidar software con mismo nombre/versión
  const consolidateSoftware = (data: Software[]) => {
    const consolidated: Record<string, Software> = {};

    data.forEach(item => {
      const key = `${item.nombre.toLowerCase()}-${item.version.toLowerCase()}`;
      if (consolidated[key]) {
        // Sumar licencias
        consolidated[key].licencias_totales += item.licencias_totales;
        consolidated[key].licencias_activas += item.licencias_activas;
        consolidated[key].licencias_caducadas += item.licencias_caducadas;
        
        // Mantener la mayor criticidad
        if (item.criticidad === 'alta' || 
           (item.criticidad === 'media' && consolidated[key].criticidad === 'baja')) {
          consolidated[key].criticidad = item.criticidad;
        }

        // Combinar departamentos
        if (item.departamentos_utilizan) {
          consolidated[key].departamentos_utilizan = [
            ...new Set([
              ...(consolidated[key].departamentos_utilizan || []),
              ...item.departamentos_utilizan
            ])
          ];
        }
      } else {
        consolidated[key] = {...item};
      }
    });

    return Object.values(consolidated);
  };

  // Cargar software desde backend
  const fetchSoftware = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/api/software`);
      if (!response.ok) {
        throw new Error(`Error HTTP! Estado: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error("Formato de datos inválido");
      }
      
      // Normalizar y consolidar datos
      const normalizedData = consolidateSoftware(data.map(item => ({
        ...item,
        id: item.id.toString(),
        nombre: item.nombre || 'Sin nombre',
        tipo: item.tipo || 'Sin tipo',
        version: item.version || '0.0.0',
        licencias_totales: item.licencias_totales || 0,
        licencias_activas: item.licencias_activas || 0,
        licencias_caducadas: item.licencias_caducadas || 0,
        departamentos_utilizan: item.departamentos_utilizan || [],
        criticidad: item.criticidad || 'baja'
      })));
      
      setSoftwareData(normalizedData);
    } catch (error) {
      console.error("Error al cargar software:", error);
      setError(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSoftware();
  }, []);

  // Agregar nuevo software
  const handleAddSoftware = async (software: Omit<Software, "id">) => {
    try {
      const response = await fetch(`${API_URL}/api/software`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(software),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al guardar software");
      }

      await fetchSoftware();
      setIsFormOpen(false);
    } catch (error) {
      console.error("Error al agregar software:", error);
      setError(error instanceof Error ? error.message : "Error al guardar");
    }
  };

  // Manejar vista de detalles
  const handleViewDetails = (id: string) => {
    setSelectedSoftwareId(id);
  };

  // Volver al listado
  const handleBackToList = () => {
    setSelectedSoftwareId(null);
    setShowAnalytics(false);
  };

  // Funciones de análisis
  const analyticsFunctions = {
    costByType: () => {
      return softwareData.reduce((acc, item) => {
        const tipo = item.tipo || 'Otro';
        acc[tipo] = (acc[tipo] || 0) + (item.costo_licencia || 0);
        return acc;
      }, {} as Record<string, number>);
    },

    needsUpdate: () => {
      return softwareData.filter(item => 
        item.requiere_actualizacion || 
        (item.fecha_caducidad && new Date(item.fecha_caducidad) < new Date())
      );
    },

    usageByDepartment: () => {
      return softwareData.reduce((acc, item) => {
        item.departamentos_utilizan?.forEach(depto => {
          acc[depto] = (acc[depto] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>);
    },

    costProjection: () => {
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      
      return softwareData
        .filter(item => item.fecha_caducidad && new Date(item.fecha_caducidad) < nextYear)
        .reduce((sum, item) => sum + (item.costo_licencia || 0), 0);
    },

    osCompatibility: () => {
      return softwareData.reduce((acc, item) => {
        item.requisitos_tecnicos?.so_compatibles?.forEach(os => {
          acc[os] = (acc[os] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>);
    }
  };

  // Estado de carga
  if (loading && !refreshing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        <p className="text-gray-600">Cargando catálogo de software...</p>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 text-red-500 mb-4">
          <FiAlertCircle size={24} />
          <h2 className="text-xl font-bold">Error al cargar datos</h2>
        </div>
        <p className="mb-6 text-gray-700">{error}</p>
        <div className="flex gap-3">
          <button
            onClick={fetchSoftware}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
            Reintentar
          </button>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Agregar manualmente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {selectedSoftwareId ? (
        <SoftwareDetails 
          softwareId={selectedSoftwareId} 
          onBack={handleBackToList}
        />
      ) : showAnalytics ? (
        <SoftwareAnalytics 
          softwareData={softwareData} 
          onClose={handleBackToList}
          analyticsFunctions={analyticsFunctions}
        />
      ) : (
        <>
          {/* Header con acciones */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Gestión de Software</h1>
              <p className="text-gray-500 mt-1">
                {softwareData.length} {softwareData.length === 1 ? 'aplicación' : 'aplicaciones'} registradas
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <button
                onClick={fetchSoftware}
                disabled={refreshing}
                className={`px-4 py-2 bg-white border border-gray-300 rounded-lg flex items-center gap-2 ${refreshing ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Actualizar</span>
              </button>

              <button
                onClick={() => setShowAnalytics(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <FiBarChart2 />
                <span>Ver Análisis</span>
              </button>
              
              <button
                onClick={() => setIsFormOpen(true)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <FiPlus />
                <span>Agregar Software</span>
              </button>
            </div>
          </div>

          {/* Formulario modal */}
          {isFormOpen && (
            <SoftwareForm
              open={isFormOpen}
              onClose={() => setIsFormOpen(false)}
              onSubmit={handleAddSoftware}
            />
          )}

          {/* Listado principal */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <SoftwareList 
              data={softwareData} 
              onViewDetails={handleViewDetails}
              onAddSoftware={() => setIsFormOpen(true)}
            />
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <h3 className="text-sm font-medium text-blue-800 mb-1">Licencias Totales</h3>
              <p className="text-2xl font-bold text-blue-600">
                {softwareData.reduce((sum, item) => sum + item.licencias_totales, 0)}
              </p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <h3 className="text-sm font-medium text-green-800 mb-1">Licencias Activas</h3>
              <p className="text-2xl font-bold text-green-600">
                {softwareData.reduce((sum, item) => sum + item.licencias_activas, 0)}
              </p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <h3 className="text-sm font-medium text-red-800 mb-1">Licencias Caducadas</h3>
              <p className="text-2xl font-bold text-red-600">
                {softwareData.reduce((sum, item) => sum + item.licencias_caducadas, 0)}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SoftwareContent;