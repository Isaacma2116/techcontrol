import { useAuth } from './useAuth';

/**
 * true si el usuario puede crear/editar/asignar (admin y tecnico).
 * Es solo para mostrar u ocultar botones: el backend valida el rol siempre.
 */
export function useCanManage() {
  const { user } = useAuth();
  return user?.role === 'admin' || user?.role === 'technician';
}
