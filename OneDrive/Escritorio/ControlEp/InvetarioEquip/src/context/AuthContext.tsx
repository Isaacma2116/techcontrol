import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AuthService from '../services/auth.service';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any; // Puedes definir una interfaz más específica para el usuario
  login: (identifier: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>; // Define una interfaz adecuada
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (AuthService.isAuthenticated()) {
        try {
          const response = await AuthService.getProfile();
          if (response.success) {
            setIsAuthenticated(true);
            setUser(response.data?.user);
          }
        } catch (error) {
          console.error('Error loading user', error);
          AuthService.logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (identifier: string, password: string) => {
    const response = await AuthService.login(identifier, password);
    if (response.success) {
      setIsAuthenticated(true);
      setUser(response.data?.user);
    } else {
      throw new Error(response.message);
    }
  };

  const register = async (userData: any) => {
    const response = await AuthService.register(userData);
    if (response.success) {
      setIsAuthenticated(true);
      setUser(response.data?.user);
    } else {
      throw new Error(response.message);
    }
  };

  const logout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}