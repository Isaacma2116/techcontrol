import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

/**
 * Protege rutas privadas en el frontend (UX, no seguridad real:
 * la seguridad real vive en el middleware `protect` del backend).
 * Si no hay sesion, redirige a /login guardando la ruta original
 * para poder volver a ella tras iniciar sesion.
 */
export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner label="Verificando sesión…" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Contrasena temporal (restablecida por un administrador): obliga a cambiarla antes de usar el resto del sistema.
  if (user.must_change_password && location.pathname !== '/configuracion/seguridad') {
    return <Navigate to="/configuracion/seguridad" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
