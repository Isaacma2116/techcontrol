import { useEffect, useState } from 'react';

/** Devuelve `value` con retraso: evita una consulta por cada tecla escrita. */
export function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}
