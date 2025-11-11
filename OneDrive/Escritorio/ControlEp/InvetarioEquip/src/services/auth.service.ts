import axios from 'axios';

const API_URL = 'http://localhost:3000/api/auth';

export interface User {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

/**
 * Registra un nuevo usuario
 * @param nombre Nombre del usuario
 * @param correo Correo electrónico
 * @param contrasena Contraseña
 * @returns Promise con la respuesta de autenticación
 */
export const register = async (
  nombre: string,
  correo: string,
  contrasena: string
): Promise<AuthResponse> => {
  try {
    const response = await axios.post(`${API_URL}/register`, {
      nombre,
      correo,
      contrasena
    });

    if (response.data.data?.token) {
      localStorage.setItem('token', response.data.data.token);
    }
    
    return response.data.data;
  } catch (error) {
    console.error('Error en registro:', error);
    throw error;
  }
};

/**
 * Inicia sesión con un usuario existente
 * @param identifier Correo electrónico o nombre de usuario
 * @param contrasena Contraseña
 * @returns Promise con la respuesta de autenticación
 */
export const login = async (
  identifier: string,
  contrasena: string
): Promise<AuthResponse> => {
  try {
    const response = await axios.post(`${API_URL}/login`, {
      identifier,
      contrasena
    });

    if (response.data.data?.token) {
      localStorage.setItem('token', response.data.data.token);
    }

    return response.data.data;
  } catch (error) {
    console.error('Error en login:', error);
    throw new Error('Credenciales incorrectas');
  }
};

/**
 * Cierra la sesión actual
 */
export const logout = (): void => {
  localStorage.removeItem('token');
};

/**
 * Obtiene el token almacenado
 * @returns Token JWT o null si no existe
 */
export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

/**
 * Verifica si hay un usuario autenticado
 * @returns true si hay un token válido, false en caso contrario
 */
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

/**
 * Obtiene los datos del usuario actual
 * @returns Datos del usuario o null si no está autenticado
 */
export const getCurrentUser = (): User | null => {
  const token = getToken();
  if (!token) return null;

  try {
    // Decodificar el token JWT (parte del payload)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.id,
      nombre: payload.nombre,
      correo: payload.correo,
      rol: payload.rol
    };
  } catch (error) {
    console.error('Error al decodificar token:', error);
    return null;
  }
};

// Exportación como objeto con todas las funciones
export const authService = {
  register,
  login,
  logout,
  getToken,
  isAuthenticated,
  getCurrentUser
};

// Exportación por defecto (opcional)
export default authService;