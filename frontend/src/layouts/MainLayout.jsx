import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/equipos': 'Equipos',
  '/accesorios': 'Accesorios',
  '/monitores': 'Monitores',
  '/impresoras': 'Impresoras',
  '/celulares': 'Celulares',
  '/redes': 'Redes y dispositivos',
  '/dispositivos-red': 'Redes y dispositivos',
  '/colaboradores': 'Colaboradores',
  '/cartas-responsivas': 'Cartas Responsivas',
  '/departamentos': 'Departamentos',
  '/ubicaciones': 'Ubicaciones',
  '/software': 'Software',
  '/licencias': 'Licencias',
  '/mantenimientos': 'Mantenimientos',
  '/reportes': 'Reportes',
  '/configuracion': 'Configuración',
};

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  // Coincide por prefijo para que rutas hijas (/colaboradores/12) conserven el titulo.
  const title =
    pageTitles[location.pathname] ||
    Object.entries(pageTitles).find(([path]) => location.pathname.startsWith(`${path}/`))?.[1] ||
    'TechControl';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header pageTitle={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
