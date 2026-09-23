import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import PublicRoute from './routes/PublicRoute.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Placeholder from './pages/Placeholder.jsx';
import Colaboradores from './pages/Colaboradores.jsx';
import ColaboradorDetalle from './pages/ColaboradorDetalle.jsx';
import Equipos from './pages/Equipos.jsx';
import EquipoDetalle from './pages/EquipoDetalle.jsx';
import Accesorios from './pages/Accesorios.jsx';
import AccesorioDetalle from './pages/AccesorioDetalle.jsx';
import CartasResponsivas from './pages/CartasResponsivas.jsx';
import Mantenimientos from './pages/Mantenimientos.jsx';
import Redes from './pages/Redes.jsx';
import RedDetalle from './pages/RedDetalle.jsx';
import DispositivoRedDetalle from './pages/DispositivoRedDetalle.jsx';
import Reportes from './pages/Reportes.jsx';
import Software from './pages/Software.jsx';
import SoftwareDetalle from './pages/SoftwareDetalle.jsx';
import Licencias from './pages/Licencias.jsx';
import LicenciaDetalle from './pages/LicenciaDetalle.jsx';
import CartaNueva from './pages/CartaNueva.jsx';
import CartaDetalle from './pages/CartaDetalle.jsx';
import ConfiguracionLayout from './pages/configuracion/ConfiguracionLayout.jsx';
import PerfilSection from './pages/configuracion/PerfilSection.jsx';
import SeguridadSection from './pages/configuracion/SeguridadSection.jsx';
import EmpresaSection from './pages/configuracion/EmpresaSection.jsx';
import DocumentosSection from './pages/configuracion/DocumentosSection.jsx';
import UsuariosSection from './pages/configuracion/UsuariosSection.jsx';
import AparienciaSection from './pages/configuracion/AparienciaSection.jsx';
import NotificacionesSection from './pages/configuracion/NotificacionesSection.jsx';
import DatosSection from './pages/configuracion/DatosSection.jsx';
import SeguridadOrganizacionSection from './pages/configuracion/SeguridadOrganizacionSection.jsx';
import TerminosSection from './pages/configuracion/TerminosSection.jsx';
import AcercaSection from './pages/configuracion/AcercaSection.jsx';
import ThemeSync from './components/ThemeSync.jsx';
import ProximamenteSection from './pages/configuracion/ProximamenteSection.jsx';
import ZonaPeligrosaSection from './pages/configuracion/ZonaPeligrosaSection.jsx';
import { SECCIONES } from './pages/configuracion/secciones.js';
import Impresoras from './pages/Impresoras.jsx';
import ImpresoraDetalle from './pages/ImpresoraDetalle.jsx';
import Celulares from './pages/Celulares.jsx';
import CelularDetalle from './pages/CelularDetalle.jsx';

// Rutas privadas que por ahora son placeholders.
// Agregar un modulo nuevo = agregar una linea aqui + en menuConfig.js
const placeholderRoutes = [
  { path: '/departamentos', title: 'Departamentos' },
  { path: '/ubicaciones', title: 'Ubicaciones' },
];

export default function App() {
  return (
    <>
      <ThemeSync />
      <Routes>
      {/* Publicas */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Privadas */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Inventario: cualquier usuario autenticado consulta; solo admin/tecnico modifica (el backend lo exige igual) */}
          <Route path="/equipos" element={<Equipos />} />
          <Route path="/equipos/:id" element={<EquipoDetalle />} />
          <Route path="/accesorios" element={<Accesorios />} />
          <Route path="/accesorios/:id" element={<AccesorioDetalle />} />
          <Route path="/impresoras" element={<Impresoras />} />
          <Route path="/impresoras/:id" element={<ImpresoraDetalle />} />
          <Route path="/celulares" element={<Celulares />} />
          <Route path="/celulares/:id" element={<CelularDetalle />} />
          {/* Mantenimientos: todos consultan el calendario; admin/tecnico agenda y cierra */}
          <Route path="/mantenimientos" element={<Mantenimientos />} />

          {/* Redes y dispositivos, y Reportes: informacion de infraestructura y de otros
              modulos restringidos (colaboradores, licencias), solo admin y tecnico */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'technician']} />}>
            <Route path="/redes" element={<Redes />} />
            <Route path="/redes/:id" element={<RedDetalle />} />
            <Route path="/dispositivos-red/:id" element={<DispositivoRedDetalle />} />
            <Route path="/reportes" element={<Reportes />} />
          </Route>

          {/* Software: catalogo visible a todos (el backend lo exige igual) */}
          <Route path="/software" element={<Software />} />
          <Route path="/software/:id" element={<SoftwareDetalle />} />

          {/* Licencias: traen costos y contratos, solo admin y tecnico */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'technician']} />}>
            <Route path="/licencias" element={<Licencias />} />
            <Route path="/licencias/:id" element={<LicenciaDetalle />} />
          </Route>

          {/* Los monitores son accesorios */}
          <Route path="/monitores" element={<Navigate to="/accesorios?tipo=Monitor" replace />} />

          {/* Colaboradores: datos personales, solo admin y tecnico (el backend lo exige igual) */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'technician']} />}>
            <Route path="/colaboradores" element={<Colaboradores />} />
            <Route path="/colaboradores/:id" element={<ColaboradorDetalle />} />
            {/* Cartas responsivas: documentos con datos personales, solo admin y tecnico */}
            <Route path="/cartas-responsivas" element={<CartasResponsivas />} />
            <Route path="/cartas-responsivas/nueva" element={<CartaNueva />} />
            <Route path="/cartas-responsivas/:id" element={<CartaDetalle />} />
            <Route path="/cartas-responsivas/:id/editar" element={<CartaNueva />} />
            {/* Ruta anterior del placeholder "Empleados" */}
            <Route path="/usuarios" element={<Navigate to="/colaboradores" replace />} />
          </Route>

          {/* Configuracion: "Mi cuenta"/"Informacion" para cualquier usuario; "Organizacion" solo administradores */}
          <Route path="/configuracion" element={<ConfiguracionLayout />}>
            <Route index element={<Navigate to="perfil" replace />} />
            <Route path="perfil" element={<PerfilSection />} />
            <Route path="apariencia" element={<AparienciaSection />} />
            <Route path="notificaciones" element={<NotificacionesSection />} />
            <Route path="seguridad" element={<SeguridadSection />} />
            <Route path="terminos" element={<TerminosSection />} />
            <Route path="acerca-de" element={<AcercaSection />} />
            <Route path="zona-peligrosa" element={<ZonaPeligrosaSection />} />
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="empresa" element={<EmpresaSection />} />
              <Route path="documentos" element={<DocumentosSection />} />
              <Route path="usuarios" element={<UsuariosSection />} />
              <Route path="seguridad-organizacion" element={<SeguridadOrganizacionSection />} />
              <Route path="datos" element={<DatosSection />} />
            </Route>
            {/* Secciones de las siguientes fases: muestran que incluiran */}
            {SECCIONES.filter((sec) => sec.proximamente).map((sec) => (
              <Route key={sec.id} element={sec.admin ? <ProtectedRoute allowedRoles={['admin']} /> : undefined}>
                <Route path={sec.id} element={<ProximamenteSection seccion={sec} />} />
              </Route>
            ))}
            <Route path="*" element={<Navigate to="perfil" replace />} />
          </Route>

          {placeholderRoutes.map(({ path, title }) => (
            <Route key={path} path={path} element={<Placeholder title={title} />} />
          ))}
        </Route>
      </Route>

      {/* 404 -> dashboard (si hay sesion) o login */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}
