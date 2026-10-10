import EquipoForm from './EquipoForm.jsx';
import AccesorioForm from './AccesorioForm.jsx';
import ImpresoraForm from './ImpresoraForm.jsx';
import CelularForm from './CelularForm.jsx';

/**
 * Formulario de cada tipo de inventario y el nombre de su prop de datos
 * (crear: prop = null; editar: prop = detalle del elemento).
 */
export const FORMS = {
  equipos: { Form: EquipoForm, prop: 'equipo' },
  accesorios: { Form: AccesorioForm, prop: 'accesorio' },
  impresoras: { Form: ImpresoraForm, prop: 'impresora' },
  celulares: { Form: CelularForm, prop: 'celular' },
};
