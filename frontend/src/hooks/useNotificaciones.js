import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { notificacionService } from '../services/notificacionService';

const POLL_MS = 45000;

/**
 * Estado de notificaciones para la campana del header: cuenta no leidas (con
 * sondeo periodico) y la lista, que solo se pide cuando se abre el panel.
 */
export function useNotificaciones() {
  const { isAuthenticated } = useAuth();
  const [noLeidas, setNoLeidas] = useState(0);
  const [notificaciones, setNotificaciones] = useState(null);
  const [cargando, setCargando] = useState(false);
  const timerRef = useRef(null);

  const cargarContador = useCallback(() => {
    if (!isAuthenticated) return;
    notificacionService.noLeidas().then((res) => setNoLeidas(res.data.total)).catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) { setNoLeidas(0); return undefined; }
    cargarContador();
    timerRef.current = setInterval(cargarContador, POLL_MS);
    return () => clearInterval(timerRef.current);
  }, [isAuthenticated, cargarContador]);

  const cargarLista = useCallback(() => {
    setCargando(true);
    notificacionService.list({ limit: 20 })
      .then((res) => setNotificaciones(res.data.notificaciones))
      .catch(() => setNotificaciones([]))
      .finally(() => setCargando(false));
  }, []);

  const marcarLeida = useCallback(async (id) => {
    setNotificaciones((lista) => lista?.map((n) => (n.id === id && !n.leida ? { ...n, leida: true } : n)) ?? lista);
    setNoLeidas((n) => Math.max(0, n - 1));
    try {
      await notificacionService.marcarLeida(id);
    } catch {
      cargarContador();
    }
  }, [cargarContador]);

  const marcarTodas = useCallback(async () => {
    setNotificaciones((lista) => lista?.map((n) => ({ ...n, leida: true })) ?? lista);
    setNoLeidas(0);
    try {
      await notificacionService.marcarTodas();
    } catch {
      cargarContador();
    }
  }, [cargarContador]);

  return { noLeidas, notificaciones, cargando, cargarLista, marcarLeida, marcarTodas, refrescarContador: cargarContador };
}
