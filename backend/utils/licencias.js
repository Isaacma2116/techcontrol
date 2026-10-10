/**
 * Definiciones compartidas del modulo de Software y Licencias.
 */

const TIPOS_SOFTWARE = ['comercial', 'gratuito', 'open_source', 'freeware', 'interno', 'otro'];
const ESTADOS_SOFTWARE = ['activo', 'descontinuado', 'no_permitido'];

// Estado GUARDADO en la licencia. El estado que se MUESTRA (estado_efectivo,
// desde v_licencias_uso) agrega 'vencida', 'agotada' y 'por_vencer': se calculan,
// nunca se guardan.
const ESTADOS_LICENCIA = ['activa', 'suspendida', 'cancelada'];
const ESTADOS_LICENCIA_EFECTIVOS = [...ESTADOS_LICENCIA, 'vencida', 'agotada', 'por_vencer'];

const PERIODICIDADES = ['unica', 'mensual', 'anual', 'bianual', 'otro'];

const ESTADOS_ASIGNACION_LICENCIA = ['activa', 'liberada'];

const CODIGO_PREFIJO = 'LIC';

// Umbrales de alerta de vencimiento (dias). Un solo lugar para cambiarlos;
// mas adelante pueden moverse a Configuracion sin tocar el resto del modulo.
const ALERTA_VENCIMIENTO_DIAS = [90, 60, 30, 7];

module.exports = {
  TIPOS_SOFTWARE,
  ESTADOS_SOFTWARE,
  ESTADOS_LICENCIA,
  ESTADOS_LICENCIA_EFECTIVOS,
  PERIODICIDADES,
  ESTADOS_ASIGNACION_LICENCIA,
  CODIGO_PREFIJO,
  ALERTA_VENCIMIENTO_DIAS,
};
