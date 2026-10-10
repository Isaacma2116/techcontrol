import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

/**
 * Para rutas publicas como /login: si el usuario ya tiene sesion
 * activa, lo mandamos directo al dashboard en vez de mostrarle
 * el formulario de login otra vez.
 */
export default function PublicRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
