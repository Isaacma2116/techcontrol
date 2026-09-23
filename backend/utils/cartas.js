/**
 * Definiciones compartidas del modulo de Cartas Responsivas:
 *  - que tipos de recurso existen y como se enlazan a sus asignaciones,
 *  - que campos se muestran de cada recurso (los usa el detalle Y el PDF, asi
 *    que hay una sola fuente de verdad),
 *  - textos por defecto y formateo de fechas.
 *
 * Los nombres de columna se interpolan en SQL: solo pueden venir de aqui.
 */

// tipo_recurso -> tabla de inventario (KINDS de utils/inventario.js) y columna en cartas_responsivas_items
const RECURSOS = {
  EQUIPO: { kind: 'equipos', col: 'asignacion_equipo_id', label: 'Equipo de cómputo', plantilla: 'equipo' },
  ACCESORIO: { kind: 'accesorios', col: 'asignacion_accesorio_id', label: 'Accesorio', plantilla: 'accesorio' },
  IMPRESORA: { kind: 'impresoras', col: 'asignacion_impresora_id', label: 'Impresora', plantilla: 'impresora' },
  CELULAR: { kind: 'celulares', col: 'asignacion_celular_id', label: 'Celular', plantilla: 'celular' },
};

const PLANTILLAS = {
  equipo: 'Equipo de cómputo',
  celular: 'Celular',
  impresora: 'Impresora',
  accesorio: 'Accesorios y periféricos',
  general: 'Recursos tecnológicos',
};

const ESTADOS_CARTA = ['borrador', 'generada', 'pendiente_firma', 'firmada', 'cancelada'];

/** Un solo tipo de recurso -> su plantilla; varios tipos distintos -> "general". */
function derivePlantilla(tipos) {
  const unique = [...new Set(tipos)];
  return unique.length === 1 ? RECURSOS[unique[0]].plantilla : 'general';
}

// ---------------------------------------------------------------------------
// Fechas
// ---------------------------------------------------------------------------

/** Acepta 'YYYY-MM-DD' o Date. Devuelve un Date LOCAL (sin correrse un dia por zona horaria). */
function toLocalDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value);
}

/** 12 de marzo de 2026 */
function fechaLarga(value) {
  const d = toLocalDate(value);
  if (!d || Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** 12/03/2026 */
function fechaCorta(value) {
  const d = toLocalDate(value);
  if (!d || Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// Campos por recurso
// ---------------------------------------------------------------------------

const ESTADO_LABEL = {
  disponible: 'Disponible',
  asignado: 'Asignado',
  mantenimiento: 'En mantenimiento',
  reparacion: 'En reparación',
  baja: 'De baja',
  perdido: 'Perdido',
};
const ESTADO_FISICO_LABEL = { excelente: 'Excelente', bueno: 'Bueno', regular: 'Regular', malo: 'Malo' };
const CONEXION_LABEL = { usb: 'USB', red: 'Red (Ethernet)', wifi: 'Wi-Fi' };
const SIN_SERIE = 'Sin número de serie';

const yesNo = (v) => (v ? 'Sí' : 'No');
const lista = (v) => (Array.isArray(v) ? v.join(', ') : v);

/**
 * Campos que se muestran de cada tipo de recurso: [etiqueta, funcion(recurso)].
 * Los valores vacios se omiten (salvo el numero de serie: "Sin número de serie").
 */
const CAMPOS = {
  EQUIPO: [
    ['Código de inventario', (r) => r.codigo_inventario],
    ['Tipo de dispositivo', (r) => r.tipo],
    ['Marca', (r) => r.marca],
    ['Modelo', (r) => r.modelo],
    ['Número de serie', (r) => r.numero_serie || SIN_SERIE],
    ['Procesador', (r) => r.procesador],
    ['Memoria RAM', (r) => r.ram],
    ['Disco', (r) => r.disco_duro],
    ['Sistema operativo', (r) => r.sistema_operativo],
    ['Dirección MAC', (r) => r.mac_address],
    ['Hostname', (r) => r.hostname],
    ['Estado físico', (r) => ESTADO_FISICO_LABEL[r.estado_fisico]],
    ['Componentes adicionales', (r) => lista(r.componentes_adicionales)],
  ],
  CELULAR: [
    ['Código de inventario', (r) => r.codigo_inventario],
    ['Marca', (r) => r.marca],
    ['Modelo', (r) => r.modelo],
    ['Número de serie', (r) => r.numero_serie || SIN_SERIE],
    ['IMEI', (r) => r.imei_1],
    ['IMEI 2', (r) => r.imei_2],
    ['Número telefónico', (r) => r.numero_telefono],
    ['Operador', (r) => r.operador],
    ['Sistema operativo', (r) => r.sistema_operativo],
    ['Almacenamiento', (r) => r.almacenamiento],
    ['Memoria RAM', (r) => r.ram],
    ['Color', (r) => r.color],
    ['Componentes adicionales', (r) => lista(r.componentes_adicionales)],
  ],
  IMPRESORA: [
    ['Código de inventario', (r) => r.codigo_inventario],
    ['Tipo', (r) => r.tipo],
    ['Marca', (r) => r.marca],
    ['Modelo', (r) => r.modelo],
    ['Número de serie', (r) => r.numero_serie || SIN_SERIE],
    ['Dirección IP', (r) => r.ip],
    ['Dirección MAC', (r) => r.mac_address],
    ['Hostname', (r) => r.hostname],
    ['Ubicación', (r) => r.ubicacion],
    ['Tipo de conexión', (r) => CONEXION_LABEL[r.tipo_conexion]],
    ['Impresión a color', (r) => yesNo(r.imprime_color)],
    ['Doble cara (dúplex)', (r) => yesNo(r.duplex)],
    ['Estado', (r) => ESTADO_LABEL[r.estado]],
  ],
  ACCESORIO: [
    ['Código de inventario', (r) => r.codigo_inventario],
    ['Tipo', (r) => r.tipo],
    ['Nombre', (r) => r.nombre],
    ['Marca', (r) => r.marca],
    ['Modelo', (r) => r.modelo],
    ['Número de serie', (r) => r.numero_serie || SIN_SERIE],
    ['Estado', (r) => ESTADO_LABEL[r.estado]],
  ],
};

/** [{ label, value }] con los campos del recurso (omite los vacios). */
function camposRecurso(tipo, recurso) {
  return CAMPOS[tipo]
    .map(([label, get]) => ({ label, value: get(recurso) }))
    .filter((c) => c.value !== undefined && c.value !== null && String(c.value).trim() !== '');
}

/** Copia del recurso que se guarda al generar la carta (sin datos volatiles ni internos). */
function snapshotRecurso(recurso) {
  const { asignacion_actual, imagen, created_at, updated_at, asignacion_id, colaborador_id,
    colaborador_id_empleado, colaborador_nombre, fecha_asignacion, ...datos } = recurso;
  return datos;
}

// ---------------------------------------------------------------------------
// Textos por defecto (editables en Configuracion > Informacion de la empresa)
// Marcadores: {empresa}, {colaborador}. Deben ser revisados por el area legal.
// ---------------------------------------------------------------------------

const TEXTO_DECLARACION_DEFAULT =
  'Por medio de la presente, yo, {colaborador}, reconozco haber recibido de {empresa} el recurso o los recursos ' +
  'tecnológicos descritos en este documento, en buen estado de funcionamiento, para mi uso exclusivo en el ' +
  'desempeño de mis actividades laborales. Me hago responsable de su custodia, uso adecuado y conservación, y me ' +
  'comprometo a devolverlos cuando la empresa lo requiera o al concluir mi relación laboral.';

const TEXTO_CONDICIONES_DEFAULT = [
  'Utilizar el recurso únicamente para fines laborales y conforme a las políticas de la empresa.',
  'No prestar, transferir, modificar ni reparar el recurso, ni instalar software no autorizado, sin la aprobación del área de TI.',
  'Mantener el recurso en buen estado y protegerlo contra pérdida, robo, daño o uso indebido.',
  'Reportar de inmediato al área de TI cualquier falla, daño, pérdida o robo.',
  'Proteger la información de la empresa contenida en el recurso y mantener la confidencialidad de las credenciales de acceso.',
  'En caso de pérdida, robo o daño por negligencia o mal uso, asumir la responsabilidad que corresponda conforme a las políticas de la empresa y a la legislación aplicable.',
  'Devolver el recurso en las mismas condiciones en que fue entregado, salvo el desgaste normal por su uso.',
].join('\n');

/** Sustituye {empresa} y {colaborador} en un texto. */
function fillTemplate(text, vars) {
  return String(text).replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
}

module.exports = {
  RECURSOS,
  PLANTILLAS,
  ESTADOS_CARTA,
  derivePlantilla,
  fechaLarga,
  fechaCorta,
  camposRecurso,
  snapshotRecurso,
  TEXTO_DECLARACION_DEFAULT,
  TEXTO_CONDICIONES_DEFAULT,
  fillTemplate,
};
