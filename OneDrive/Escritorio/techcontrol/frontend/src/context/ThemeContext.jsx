import { createContext, useCallback, useEffect, useMemo, useState } from 'react';

export const ThemeContext = createContext(null);

const STORAGE_KEY = 'tc_preferencias_ui';
const DEFECTO = { tema: 'automatico', densidad: 'comoda', acento: 'azul' };

const leerCache = () => {
  try {
    return { ...DEFECTO, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return DEFECTO;
  }
};

/**
 * Tema, densidad y color de acento (Configuracion > Apariencia). Se aplican
 * como clase/atributos en <html> (ver tailwind.config.js + index.css: TODA
 * la app responde via variables CSS, sin tocar cada componente).
 *
 * Es independiente de AuthContext a proposito (asi funciona tambien en /login);
 * `ThemeSync` (montado dentro de App) es quien copia `user.preferencias_ui`
 * del servidor hacia aqui una vez que hay sesion.
 */
export function ThemeProvider({ children }) {
  const [preferencias, setPreferenciasState] = useState(leerCache);
  const [sistemaOscuro, setSistemaOscuro] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  // "automatico" sigue al sistema operativo mientras esa opcion este activa.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setSistemaOscuro(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const oscuro = preferencias.tema === 'oscuro' || (preferencias.tema === 'automatico' && sistemaOscuro);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('dark', oscuro);
    if (preferencias.acento && preferencias.acento !== 'azul') html.setAttribute('data-acento', preferencias.acento);
    else html.removeAttribute('data-acento');
    if (preferencias.densidad === 'compacta') html.setAttribute('data-densidad', 'compacta');
    else html.removeAttribute('data-densidad');
  }, [oscuro, preferencias.acento, preferencias.densidad]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(preferencias)); } catch { /* modo privado: sin cache, no es grave */ }
  }, [preferencias]);

  // Solo actualiza el estado local (aplica al instante); guardarlo en el servidor
  // lo hace quien llama (AparienciaSection), que ya tiene el service de perfil.
  const setPreferencias = useCallback((cambios) => {
    setPreferenciasState((actual) => ({ ...actual, ...cambios }));
  }, []);

  // Usado por ThemeSync al iniciar sesion: el servidor manda sobre la cache local.
  const aplicarDesdeServidor = useCallback((preferenciasServidor) => {
    if (preferenciasServidor) setPreferenciasState((actual) => ({ ...actual, ...preferenciasServidor }));
  }, []);

  const value = useMemo(
    () => ({ ...preferencias, oscuro, setPreferencias, aplicarDesdeServidor }),
    [preferencias, oscuro, setPreferencias, aplicarDesdeServidor]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
