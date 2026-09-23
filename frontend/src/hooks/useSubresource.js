import { useEffect, useState } from 'react';

/**
 * Carga una lista secundaria de una pantalla de detalle (equipos asignados,
 * historial...) de forma independiente: si una falla, el resto de la pagina
 * sigue funcionando.
 *  - fetcher(id) -> Promise con { data: { [key]: [...] } }
 *  - reloadKey: cambia para volver a consultar
 */
export function useSubresource(fetcher, key, id, reloadKey = 0) {
  const [state, setState] = useState({ items: [], loading: true, error: '' });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: '' }));
    fetcher(id)
      .then((res) => !cancelled && setState({ items: res.data[key], loading: false, error: '' }))
      .catch((err) => !cancelled && setState({ items: [], loading: false, error: err.message }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, reloadKey]);

  return state;
}
