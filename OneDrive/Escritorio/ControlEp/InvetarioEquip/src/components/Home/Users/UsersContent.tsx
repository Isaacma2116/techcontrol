import React, { useEffect, useState, useCallback } from "react";
import UserForm from "./UserForm";
import ColaboradorDetalle from "./ColaboradorDetalle";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiX, FiPlus, FiUser, FiEdit2, FiChevronRight, FiEye } from "react-icons/fi";

interface Colaborador {
  _id: string;
  nombre: string;
  foto?: string;
  email: string;
  telefono?: string;
  departamento?: string;
  creado_en: string;
  actualizado_en: string;
}

const UsersContent: React.FC = () => {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [filteredColaboradores, setFilteredColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedColaborador, setSelectedColaborador] = useState<Colaborador | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const BASE_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchColaboradores = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/colaboradores`);
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();

        if (!data?.success) {
          throw new Error(data?.message || "Error al obtener colaboradores");
        }

        setColaboradores(data.data || []);
        setFilteredColaboradores(data.data || []);
      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching colaboradores:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchColaboradores();
  }, [BASE_URL]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredColaboradores(colaboradores);
    } else {
      const filtered = colaboradores.filter(colaborador =>
        colaborador.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredColaboradores(filtered);
    }
  }, [searchTerm, colaboradores]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedColaborador(null);
  };

  const handleOpenCreateModal = () => {
    setIsModalOpen(true);
    setSelectedColaborador(null);
  };

  const handleOpenEditModal = (colaborador: Colaborador) => {
    setIsModalOpen(true);
    setSelectedColaborador(colaborador);
  };

  const handleOpenDetail = (colaborador: Colaborador) => {
    setViewMode('detail');
    setSelectedColaborador(colaborador);
  };

  const handleBackToList = useCallback(() => {
    setViewMode('list');
    setSelectedColaborador(null);
  }, []);

  const handleSuccess = () => {
    window.location.reload();
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"
        ></motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded"
        role="alert"
      >
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </motion.div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Modal para el formulario */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    {selectedColaborador ? "Editar Colaborador" : "Nuevo Colaborador"}
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <FiX className="h-6 w-6" />
                  </button>
                </div>
                <UserForm 
                  colaborador={selectedColaborador || undefined}
                  onClose={handleCloseModal} 
                  onSuccess={handleSuccess} 
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {viewMode === 'detail' && selectedColaborador ? (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <ColaboradorDetalle 
            colaborador={selectedColaborador} 
            onBack={handleBackToList}
            onEdit={() => handleOpenEditModal(selectedColaborador)}
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold text-gray-800">Colaboradores</h1>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-grow max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por nombre..."
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
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
                Agregar Colaborador
              </button>
            </div>
          </div>

          {filteredColaboradores.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-sm p-8 text-center border border-gray-200"
            >
              <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
                <FiUser className="h-full w-full" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "No se encontraron resultados" : "No hay colaboradores registrados"}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm 
                  ? "Intenta con otro término de búsqueda" 
                  : "Comienza agregando un nuevo colaborador a tu equipo."}
              </p>
              <button
                onClick={searchTerm ? clearSearch : handleOpenCreateModal}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
              >
                {searchTerm ? "Limpiar búsqueda" : "Agregar Primer Colaborador"}
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <AnimatePresence>
                {filteredColaboradores.map((colaborador) => (
                  <motion.div
                    key={colaborador._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    layout
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-200"
                  >
                    <button 
                      onClick={() => handleOpenDetail(colaborador)}
                      className="w-full text-left"
                    >
                      <div className="p-4 md:p-6 flex items-center space-x-4">
                        {colaborador.foto ? (
                          <img
                            src={colaborador.foto}
                            alt={colaborador.nombre}
                            className="h-14 w-14 md:h-16 md:w-16 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
                            <FiUser className="h-6 w-6 md:h-8 md:w-8" />
                          </div>
                        )}
                        <div className="flex-grow overflow-hidden">
                          <h3 className="text-base md:text-lg font-medium text-gray-900 truncate">
                            {colaborador.nombre}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">{colaborador.email}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(colaborador.creado_en).toLocaleDateString()}
                          </p>
                        </div>
                        <FiChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      </div>
                    </button>
                    <div className="bg-gray-50 px-4 md:px-6 py-3 flex justify-end space-x-3 border-t border-gray-200">
                      <button 
                        onClick={() => handleOpenDetail(colaborador)}
                        className="text-sm text-orange-600 hover:text-orange-800 font-medium flex items-center"
                      >
                        <FiEye className="mr-1" /> Detalles
                      </button>
                      <button 
                        onClick={() => handleOpenEditModal(colaborador)}
                        className="text-sm text-gray-600 hover:text-gray-800 font-medium flex items-center"
                      >
                        <FiEdit2 className="mr-1" /> Editar
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default UsersContent;