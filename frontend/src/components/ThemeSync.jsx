import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

/**
 * Copia `user.preferencias_ui` (lo que guardo el servidor) hacia ThemeContext
 * en cuanto hay sesion. No renderiza nada: es el puente entre AuthContext y
 * ThemeContext, que se mantienen independientes a proposito (Theme funciona
 * incluso en /login, antes de que exista `user`).
 */
export default function ThemeSync() {
  const { user } = useAuth();
  const { aplicarDesdeServidor } = useTheme();

  useEffect(() => {
    if (user?.preferencias_ui) aplicarDesdeServidor(user.preferencias_ui);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return null;
}
