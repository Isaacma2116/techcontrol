import React from "react";
import { FiPieChart, FiBarChart2, FiTrendingUp, FiGrid, FiAlertTriangle, FiDollarSign, FiUsers } from "react-icons/fi";
import { PieChart, BarChart, LineChart } from "./Charts";

interface AnalyticsProps {
  softwareData: Software[];
  onClose: () => void;
  analyticsFunctions: {
    costByType: () => Record<string, number>;
    needsUpdate: () => Software[];
    usageByDepartment: () => Record<string, number>;
    costProjection: () => number;
    osCompatibility: () => Record<string, number>;
  };
}

const SoftwareAnalytics: React.FC<AnalyticsProps> = ({ 
  softwareData, 
  onClose,
  analyticsFunctions 
}) => {
  // Preparar datos para gráficos
  const licenseData = {
    total: softwareData.reduce((sum, item) => sum + item.licencias_totales, 0),
    active: softwareData.reduce((sum, item) => sum + item.licencias_activas, 0),
    expired: softwareData.reduce((sum, item) => sum + item.licencias_caducadas, 0),
  };

  const byType = softwareData.reduce((acc, item) => {
    acc[item.tipo] = (acc[item.tipo] || 0) + item.licencias_totales;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FiTrendingUp className="text-orange-500" />
          Análisis Global de Software
        </h2>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Volver al listado
        </button>
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <div className="flex items-center gap-3">
            <FiGrid className="text-blue-500 text-xl" />
            <h3 className="font-medium text-blue-800">Software Registrado</h3>
          </div>
          <p className="text-3xl font-bold text-blue-600 mt-2">{softwareData.length}</p>
        </div>

        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
          <div className="flex items-center gap-3">
            <FiPieChart className="text-green-500 text-xl" />
            <h3 className="font-medium text-green-800">Licencias Activas</h3>
          </div>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {licenseData.active} <span className="text-sm font-normal text-green-500">/ {licenseData.total}</span>
          </p>
        </div>

        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
          <div className="flex items-center gap-3">
            <FiDollarSign className="text-purple-500 text-xl" />
            <h3 className="font-medium text-purple-800">Costo Total</h3>
          </div>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            ${softwareData.reduce((sum, item) => sum + (item.costo_licencia || 0), 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
            <FiPieChart className="text-orange-500" />
            Distribución por Tipo
          </h3>
          <div className="h-64">
            <PieChart 
              data={Object.entries(byType).map(([name, value]) => ({ name, value }))}
              colors={['#3b82f6', '#10b981', '#f59e0b', '#6366f1']}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
            <FiBarChart2 className="text-orange-500" />
            Estado de Licencias
          </h3>
          <div className="h-64">
            <BarChart
              data={[
                { name: 'Total', value: licenseData.total },
                { name: 'Activas', value: licenseData.active },
                { name: 'Caducadas', value: licenseData.expired },
              ]}
              colors={['#3b82f6', '#10b981', '#ef4444']}
            />
          </div>
        </div>
      </div>

      {/* Análisis avanzados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
            <FiDollarSign className="text-orange-500" />
            Costos por Tipo
          </h3>
          <div className="h-64">
            <BarChart
              data={Object.entries(analyticsFunctions.costByType()).map(([name, value]) => ({
                name,
                value
              }))}
              colors={['#6366f1']}
              label="Costo total"
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
            <FiUsers className="text-orange-500" />
            Uso por Departamento
          </h3>
          <div className="h-64">
            <PieChart
              data={Object.entries(analyticsFunctions.usageByDepartment()).map(([name, value]) => ({
                name,
                value
              }))}
              colors={['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899']}
            />
          </div>
        </div>
      </div>

      {/* Sección de alertas y proyecciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
            <FiAlertTriangle className="text-orange-500" />
            Software que Requiere Atención ({analyticsFunctions.needsUpdate().length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {analyticsFunctions.needsUpdate().slice(0, 10).map(item => (
              <div key={item.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{item.nombre} v{item.version}</p>
                  <p className="text-sm text-gray-500">{item.tipo}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  item.requiere_actualizacion ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                }`}>
                  {item.requiere_actualizacion ? 'Actualización' : 'Licencia caducada'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
            <FiDollarSign className="text-orange-500" />
            Proyección de Costos
          </h3>
          <div className="flex flex-col h-64 justify-between">
            <div>
              <p className="text-3xl font-bold text-purple-600">
                ${analyticsFunctions.costProjection().toLocaleString()}
              </p>
              <p className="text-gray-500">En renovaciones próximas</p>
            </div>
            <div className="text-sm text-gray-500">
              <p>
                {softwareData.filter(s => s.fecha_caducidad).length} de {softwareData.length} 
                {' '}con fecha de caducidad registrada
              </p>
              <p className="mt-2">
                {softwareData.filter(s => s.costo_licencia).length} de {softwareData.length} 
                {' '}con costo registrado
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoftwareAnalytics;