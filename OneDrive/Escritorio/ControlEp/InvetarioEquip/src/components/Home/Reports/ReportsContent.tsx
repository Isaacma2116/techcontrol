import React from 'react';

interface ReportsContentProps {
  sidebarOpen: boolean;
  handleLogout?: () => void;
}

export default function ReportsContent({ sidebarOpen }: ReportsContentProps) {
  const reports = [
    { id: 1, title: 'Reporte Mensual', date: '15/03/2023', downloads: 45 },
    { id: 2, title: 'Auditoría Sistema', date: '28/03/2023', downloads: 23 },
    { id: 3, title: 'Errores Críticos', date: '05/04/2023', downloads: 31 }
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="bg-white shadow-sm">
        <div className="flex justify-between items-center px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Reportes</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Generar Nuevo Reporte</h2>
            <button className="px-4 py-2 bg-[#FF6B00] text-white rounded-lg hover:bg-[#FF8C00] transition-colors">
              Generar Reporte
            </button>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Reportes Recientes</h2>
            <div className="space-y-4">
              {reports.map(report => (
                <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium">{report.title}</h3>
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>Fecha: {report.date}</span>
                    <span>Descargas: {report.downloads}</span>
                  </div>
                  <div className="mt-3 flex space-x-2">
                    <button className="text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded">
                      Descargar
                    </button>
                    <button className="text-sm px-3 py-1 bg-gray-100 text-gray-800 rounded">
                      Compartir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}