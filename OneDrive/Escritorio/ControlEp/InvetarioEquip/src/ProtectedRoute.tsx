import { Navigate, Outlet } from 'react-router-dom';
import { authService } from './services/auth.service';

export default function ProtectedRoute() {
  const user = authService.getCurrentUser();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}