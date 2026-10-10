import { useAuth } from './useAuth';

/**
 * true si el usuario tiene el permiso (p. ej. 'cartas.generar'). Los permisos vienen del
 * backend en /auth/me. Solo sirve para mostrar u ocultar opciones: el backend valida siempre.
 */
export function useCan() {
  const { user } = useAuth();
  const permissions = user?.permissions || [];
  return (permiso) => permissions.includes(permiso);
}
