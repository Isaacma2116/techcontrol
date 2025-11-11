import React, { useState } from "react";
import { FiSearch, FiPlus, FiFilter, FiDownload, FiInfo, FiEdit2, FiTrash2 } from "react-icons/fi";

interface Software {
  id: string;
  nombre: string;
  tipo: string;
  version: string;
  licencias_totales: number;
  licencias_activas: number;
  licencias_caducadas: number;
  ultima_actualizacion?: string;
  criticidad?: 'alta' | 'media' | 'baja';
}

interface SoftwareListProps {
  data: Software[];
  onViewDetails: (id: string) => void;
  onAddSoftware?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onExport?: () => void;
}

const SoftwareList: React.FC<SoftwareListProps> = ({ 
  data, 
  onViewDetails,
  onAddSoftware,
  onEdit,
  onDelete,
  onExport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [sortConfig, setSortConfig] = useState<{key: keyof Software; direction: 'asc' | 'desc'} | null>(null);

  const filteredData = data
    .filter(item => {
      const matchesSearch = item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.tipo.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filter === 'active') return matchesSearch && item.licencias_activas > 0;
      if (filter === 'expired') return matchesSearch && item.licencias_caducadas > 0;
      return matchesSearch;
    })
    .sort((a, b) => {
      if (!sortConfig) return 0;
      
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

  const requestSort = (key: keyof Software) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getCriticidadColor = (criticidad?: string) => {
    switch(criticidad) {
      case 'alta': return 'bg-red-100 text-red-800';
      case 'media': return 'bg-yellow-100 text-yellow-800';
      case 'baja': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header con acciones */}
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar software..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <div className="relative">
            <select
              className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
            >
              <option value="all">Todos</option>
              <option value="active">Con licencias activas</option>
              <option value="expired">Con licencias caducadas</option>
            </select>
            <FiFilter className="absolute right-3 top-2.5 text-gray-400" />
          </div>
          
          {onExport && (
            <button 
              onClick={onExport}
              className="px-3 py-2 flex items-center gap-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              <FiDownload size={16} />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          )}
          
          {onAddSoftware && (
            <button 
              onClick={onAddSoftware}
              className="px-4 py-2 flex items-center gap-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiPlus size={16} />
              <span>Agregar</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabla responsive */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('nombre')}
              >
                <div className="flex items-center gap-1">
                  Nombre
                  {sortConfig?.key === 'nombre' && (
                    <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('tipo')}
              >
                <div className="flex items-center gap-1">
                  Tipo
                  {sortConfig?.key === 'tipo' && (
                    <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('version')}
              >
                <div className="flex items-center gap-1">
                  Versión
                  {sortConfig?.key === 'version' && (
                    <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Licencias
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <FiSearch size={32} className="mb-2" />
                    <p className="text-lg">No se encontraron resultados</p>
                    <p className="text-sm">Intenta con otros términos de búsqueda</p>
                    {onAddSoftware && (
                      <button
                        onClick={onAddSoftware}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <FiPlus size={16} />
                        Agregar nuevo software
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                        {item.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">{item.nombre}</div>
                        {item.criticidad && (
                          <span className={`px-2 py-1 text-xs rounded-full ${getCriticidadColor(item.criticidad)}`}>
                            {item.criticidad.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                      {item.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      v{item.version}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ 
                            width: `${(item.licencias_activas / item.licencias_totales) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {item.licencias_activas}/{item.licencias_totales}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-green-500"></span>
                        <span className="text-xs text-gray-600">
                          Activas: {item.licencias_activas}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-red-500"></span>
                        <span className="text-xs text-gray-600">
                          Caducadas: {item.licencias_caducadas}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewDetails(item.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver detalles"
                      >
                        <FiInfo size={18} />
                      </button>
                      
                      {onEdit && (
                        <button
                          onClick={() => onEdit(item.id)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <FiEdit2 size={18} />
                        </button>
                      )}
                      
                      {onDelete && (
                        <button
                          onClick={() => onDelete(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer con paginación */}
      {filteredData.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Mostrando <span className="font-medium">1</span> a <span className="font-medium">10</span> de <span className="font-medium">{filteredData.length}</span> resultados
          </div>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              Anterior
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SoftwareList;