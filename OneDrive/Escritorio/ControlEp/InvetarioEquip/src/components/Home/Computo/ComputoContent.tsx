import React, { useEffect, useState, useCallback } from "react";
import EquipmentForm from "./EquipmentForm";
import EquipoDetalle from "./EquipoDetalle";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiX, FiPlus, FiMonitor, FiEdit2, FiChevronRight, FiEye } from "react-icons/fi";

interface Equipo {
  id: number;
  marca: string;
  modelo: string;
  tipo: string;
  estado: 'activo' | 'inactivo' | 'en_reparacion' | 'dado_de_baja';
  foto_equipo?: string;
}

const estadoLabel: Record<string, { color: string; label: string }> = {
  activo: { color: "bg-green-100 text-green-700", label: "Activo" },
  en_reparacion: { color: "bg-yellow-100 text-yellow-800", label: "En reparación" },
  dado_de_baja: { color: "bg-red-100 text-red-800", label: "Dado de baja" },
  inactivo: { color: "bg-gray-100 text-gray-700", label: "Inactivo" },
};

const ComputoContent: React.FC<{ sidebarOpen: boolean }> = ({ sidebarOpen }) => {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [filteredEquipos, setFilteredEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedEquipo, setSelectedEquipo] = useState<Equipo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Usa window.location.origin si el env está vacío
  const BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;

  const fetchEquipos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/api/equipos`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const data = await response.json();
      const arr = Array.isArray(data) ? data : (data.data || []);
      setEquipos(arr);
      setFilteredEquipos(arr);
    } catch (err: any) {
      setEquipos([]);
      setFilteredEquipos([]);
      setError("No se pudieron cargar los equipos. Intenta más tarde.");
      console.error("Error fetching equipos:", err);
    } finally {
      setLoading(false);
    }
  }, [BASE_URL]);

  useEffect(() => {
    fetchEquipos();
  }, [fetchEquipos]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredEquipos(equipos);
    } else {
      const filtered = equipos.filter(equipo =>
        `${equipo.marca} ${equipo.modelo}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEquipos(filtered);
    }
  }, [searchTerm, equipos]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEquipo(null);
  };

  const handleOpenCreateModal = () => {
    setIsModalOpen(true);
    setSelectedEquipo(null);
  };

  const handleOpenEditModal = (equipo: Equipo) => {
    setIsModalOpen(true);
    setSelectedEquipo(equipo);
  };

  const handleOpenDetail = (equipo: Equipo) => {
    setViewMode('detail');
    setSelectedEquipo(equipo);
  };

  const handleBackToList = useCallback(() => {
    setViewMode('list');
    setSelectedEquipo(null);
  }, []);

  const handleSuccess = () => {
    fetchEquipos();
    setIsModalOpen(false);
    setSelectedEquipo(null);
  };

  const clearSearch = () => setSearchTerm('');

  // Helper para obtener la URL absoluta de la imagen
  const getFotoEquipoUrl = (foto_equipo?: string) => {
    if (!foto_equipo) return undefined;
    // Si ya es una URL absoluta, úsalas así
    if (/^https?:\/\//.test(foto_equipo)) return foto_equipo;
    // Si empieza con /uploads, anteponer BASE_URL (sin doble barra)
    if (foto_equipo.startsWith('/uploads')) {
      // Quita doble slash si BASE_URL termina en "/"
      return BASE_URL.replace(/\/$/, '') + foto_equipo;
    }
    // Si no, retornar como está (puedes personalizar esto)
    return foto_equipo;
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-100">
      {/* Modal para el formulario */}
      <EquipmentForm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        initialData={
          selectedEquipo
            ? {
                ...selectedEquipo,
                foto_equipo: undefined // o null, según lo que acepte tu formulario
              }
            : undefined
        }
      />

      {/* Header */}
      <div className="flex items-center justify-between w-full px-6 py-6 bg-white shadow mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Equipos de Cómputo</h1>
        <div className="flex gap-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por marca o modelo..."
              className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={!!error}
              style={{ minWidth: 200 }}
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-2.5"
              >
                <FiX className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
              </button>
            )}
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center whitespace-nowrap"
          >
            <FiPlus className="h-5 w-5 mr-2" />
            Agregar Equipo
          </button>
        </div>
      </div>

      {/* error visible */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4"
          role="alert"
        >
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </motion.div>
      )}

      {/* vista detalle o listado */}
      <div className="flex-1 px-4 md:px-6">
        {viewMode === 'detail' && selectedEquipo ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <EquipoDetalle
              equipo={selectedEquipo}
              onBack={handleBackToList}
              onEdit={() => handleOpenEditModal(selectedEquipo)}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {!loading && !error && filteredEquipos.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg shadow-sm p-8 text-center border border-gray-200"
              >
                <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
                  <FiMonitor className="h-full w-full" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm
                    ? "No se encontraron resultados"
                    : "No hay equipos registrados"}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm
                    ? "Intenta con otro término de búsqueda"
                    : "Comienza agregando un nuevo equipo de cómputo."}
                </p>
                <button
                  onClick={searchTerm ? clearSearch : handleOpenCreateModal}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                >
                  {searchTerm ? "Limpiar búsqueda" : "Agregar Primer Equipo"}
                </button>
              </motion.div>
            )}

            {!loading && !error && filteredEquipos.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <AnimatePresence>
                  {filteredEquipos.map((equipo) => {
                    const estado = estadoLabel[equipo.estado] || {
                      color: "bg-gray-100 text-gray-700",
                      label: equipo.estado,
                    };
                    return (
                      <motion.div
                        key={equipo.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        layout
                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-200"
                      >
                        <button
                          onClick={() => handleOpenDetail(equipo)}
                          className="w-full text-left"
                        >
                          <div className="p-4 md:p-6 flex items-center space-x-4">
                            {equipo.foto_equipo ? (
                              <img
                                src={getFotoEquipoUrl(equipo.foto_equipo)}
                                alt={equipo.marca + " " + equipo.modelo}
                                className="h-14 w-14 md:h-16 md:w-16 rounded-full object-cover flex-shrink-0"
                                crossOrigin="anonymous"
                              />
                            ) : (
                              <div className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
                                <FiMonitor className="h-6 w-6 md:h-8 md:w-8" />
                              </div>
                            )}
                            <div className="flex-grow overflow-hidden">
                              <h3 className="text-base md:text-lg font-medium text-gray-900 truncate">
                                {equipo.marca} {equipo.modelo}
                              </h3>
                              <p className="text-sm text-gray-500 truncate">{equipo.tipo}</p>
                              <span className={`text-xs font-semibold inline-block mt-2 px-2 py-1 rounded-full ${estado.color}`}>
                                {estado.label}
                              </span>
                            </div>
                            <FiChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          </div>
                        </button>
                        <div className="bg-gray-50 px-4 md:px-6 py-3 flex justify-end space-x-3 border-t border-gray-200">
                          <button
                            onClick={() => handleOpenDetail(equipo)}
                            className="text-sm text-orange-600 hover:text-orange-800 font-medium flex items-center"
                          >
                            <FiEye className="mr-1" /> Detalles
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(equipo)}
                            className="text-sm text-gray-600 hover:text-gray-800 font-medium flex items-center"
                          >
                            <FiEdit2 className="mr-1" /> Editar
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {loading && (
              <div className="flex justify-center items-center h-64">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"
                ></motion.div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ComputoContent;