import { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { SESSION_EXPIRED_EVENT } from '../services/api';

export const AuthContext = createContext(null);

/**
 * Fuente unica de verdad del estado de sesion en el frontend.
 * Al montar la app, se pregunta al backend "quien soy" via /auth/me
 * (que depende de la cookie HttpOnly). El frontend NUNCA decide
 * por si mismo si el usuario esta autenticado: solo refleja lo
 * que el backend responde.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await authService.getMe();
      setUser(res.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Otra pantalla recibio 401: la sesion se cerro o se revoco. ProtectedRoute lleva al login.
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const login = async (identifier, password, remember = false) => {
    const res = await authService.login(identifier, password, remember);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    refresh: fetchCurrentUser,
    updateUser: setUser, // tras editar el perfil (el backend devuelve el usuario completo)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
