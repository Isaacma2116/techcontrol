import React from 'react';
import { EquiposPanel } from './EquiposPanel';
import { ColaboradoresPanel } from './ColaboradoresPanel';

type ActiveTab = 'dashboard' | 'equipos' | 'colaboradores' | string;
type MainContentProps = {
  activeTab?: ActiveTab;
  handleLogout: () => void;
  sidebarOpen?: boolean;
};

export default function MainContent({
  activeTab,
  handleLogout,
  sidebarOpen = false
}: MainContentProps) {
  const safeTab: ActiveTab = activeTab ?? 'dashboard';

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-blue-800 tracking-tight">Panel de Control</h1>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <div className="relative">
              <button className="flex items-center space-x-2 focus:outline-none">
                <img src="/user-avatar.png" alt="User" className="h-9 w-9 rounded-full border-2 border-blue-200 shadow" />
                <span className="hidden md:inline-block font-semibold text-slate-700">Usuario</span>
              </button>
            </div>
            <button onClick={handleLogout}
              className="px-5 py-2 bg-gradient-to-r from-[#FF6B00] to-[#FF9900] text-white rounded-lg hover:from-orange-600 hover:to-yellow-500 font-semibold shadow transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-2 py-7">
        {safeTab === 'dashboard' && (
          <>
            <EquiposPanel />
            <ColaboradoresPanel />
          </>
        )}
        {safeTab === 'equipos' && <EquiposPanel />}
        {safeTab === 'colaboradores' && <ColaboradoresPanel />}
        {safeTab !== 'dashboard' && safeTab !== 'equipos' && safeTab !== 'colaboradores' && (
          <div className="max-w-lg mx-auto bg-white rounded-2xl shadow p-8 mt-12 border border-slate-100">
            <h2 className="text-xl font-semibold mb-4 text-red-600">Pestaña no encontrada</h2>
            <p className="text-gray-700 mb-2">
              Valor de activeTab: <strong>{String(safeTab)}</strong>
            </p>
            <p className="text-gray-400 text-sm font-medium">
              Asegúrate de que el componente padre pasa una pestaña válida.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}