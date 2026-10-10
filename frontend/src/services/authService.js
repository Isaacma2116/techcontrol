import { api } from './api';

export const authService = {
  login: (identifier, password, remember) =>
    api.post('/auth/login', { identifier, password, remember }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};
