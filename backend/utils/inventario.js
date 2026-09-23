/**
 * Definiciones compartidas por Equipos, Accesorios, Impresoras y Celulares.
 * Todos siguen el mismo ciclo (disponible -> asignado -> devuelto ...) y solo
 * cambian los nombres de tabla y algunos campos, asi que se describen aqui una
 * vez y los modelos/controladores/rutas se generan a partir de esta config.
 *
 * IMPORTANTE: los nombres de tabla/columna de KINDS se interpolan en SQL. Solo
 * pueden venir de este archivo, nunca del request.
 */

const ESTADOS = ['disponible', 'asignado', 'mantenimiento', 'reparacion', 'baja', 'perdido'];

// 'asignado' no se fija a mano: solo cambia al asignar/devolver.
const ESTADOS_MANUALES = ['disponible', 'mantenimiento', 'reparacion', 'baja', 'perdido'];

const CONDICIONES = ['bueno', 'regular', 'danado', 'perdido'];

const KINDS = {
  equipos: {
    kind: 'equipos',
    label: 'equipo',
    Label: 'Equipo',
    art: 'el',
    Art: 'El',
    o: 'o',
    table: 'equipos',
    tipoTable: 'tipos_equipo',
    tipoFk: 'tipo_equipo_id',
    asigTable: 'asignaciones_equipos',
    asigFk: 'equipo_id',
    vigenteCol: 'equipo_vigente_id',
    prefix: 'EQ',
    imageDir: 'equipos',
    // Contrasena de acceso al equipo (Windows, BIOS...): se guarda cifrada (utils/cripto.js)
    // en password_cifrado, nunca en cfg.editable. Revelarla exige 'equipos.ver_contrasenas'.
    withPassword: true,
    // Campos que el formulario puede escribir (el codigo se maneja aparte).
    editable: [
      'tipo_equipo_id', 'marca', 'modelo', 'numero_serie',
      'procesador', 'ram', 'disco_duro', 'tarjeta_madre', 'tarjeta_grafica',
      'sistema_operativo', 'mac_address', 'hostname', 'componentes_adicionales',
      'estado_fisico', 'observaciones', 'fecha_compra', 'garantia_vence', 'garantia_detalle',
    ],
    dateFields: ['fecha_compra', 'garantia_vence', 'fecha_baja'],
    jsonFields: ['componentes_adicionales'],
    boolFields: [],
    withHolder: true,
    titulo: "TRIM(CONCAT_WS(' ', i.marca, i.modelo))",
    searchCols: ['i.codigo_inventario', 'i.numero_serie', 'i.marca', 'i.modelo', 'i.hostname', 'i.mac_address'],
    uniqueFields: {
      uq_equipos_codigo: ['codigo_inventario', 'Ya existe un equipo con ese código de inventario.'],
      uq_equipos_serie: ['numero_serie', 'Ya existe un equipo con ese número de serie.'],
    },
    fkFields: { fk_equipos_tipo: ['tipo_equipo_id', 'El tipo de equipo seleccionado no existe.'] },
  },
  accesorios: {
    kind: 'accesorios',
    label: 'accesorio',
    Label: 'Accesorio',
    art: 'el',
    Art: 'El',
    o: 'o',
    table: 'accesorios',
    tipoTable: 'tipos_accesorio',
    tipoFk: 'tipo_accesorio_id',
    asigTable: 'asignaciones_accesorios',
    asigFk: 'accesorio_id',
    vigenteCol: 'accesorio_vigente_id',
    prefix: 'ACC',
    imageDir: 'accesorios',
    editable: [
      'tipo_accesorio_id', 'nombre', 'marca', 'modelo', 'numero_serie',
      'observaciones', 'fecha_compra', 'garantia_vence',
    ],
    dateFields: ['fecha_compra', 'garantia_vence', 'fecha_baja'],
    jsonFields: [],
    boolFields: [],
    withHolder: false,
    titulo: 'i.nombre',
    searchCols: ['i.codigo_inventario', 'i.numero_serie', 'i.nombre', 'i.marca', 'i.modelo'],
    uniqueFields: {
      uq_accesorios_codigo: ['codigo_inventario', 'Ya existe un accesorio con ese código de inventario.'],
      uq_accesorios_serie: ['numero_serie', 'Ya existe un accesorio con ese número de serie.'],
    },
    fkFields: { fk_accesorios_tipo: ['tipo_accesorio_id', 'El tipo de accesorio seleccionado no existe.'] },
  },
  impresoras: {
    kind: 'impresoras',
    label: 'impresora',
    Label: 'Impresora',
    art: 'la',
    Art: 'La',
    o: 'a', // genero gramatical: "asignad{o}", "devuelt{o}"
    table: 'impresoras',
    tipoTable: 'tipos_impresora',
    tipoFk: 'tipo_impresora_id',
    asigTable: 'asignaciones_impresoras',
    asigFk: 'impresora_id',
    vigenteCol: 'impresora_vigente_id',
    prefix: 'IMP',
    imageDir: 'impresoras',
    // Donde esta fisicamente (LEFT JOIN a ubicaciones); independiente del responsable.
    ubicacion: true,
    editable: [
      'tipo_impresora_id', 'marca', 'modelo', 'numero_serie',
      'ip', 'mac_address', 'hostname', 'ubicacion_id', 'tipo_conexion',
      'imprime_color', 'duplex', 'contador_impresiones',
      'observaciones', 'fecha_compra', 'garantia_vence', 'garantia_detalle',
    ],
    dateFields: ['fecha_compra', 'garantia_vence', 'fecha_baja'],
    jsonFields: [],
    boolFields: ['imprime_color', 'duplex'],
    withHolder: true,
    titulo: "TRIM(CONCAT_WS(' ', i.marca, i.modelo))",
    searchCols: ['i.codigo_inventario', 'i.numero_serie', 'i.marca', 'i.modelo', 'i.ip', 'i.hostname', 'i.mac_address'],
    uniqueFields: {
      uq_impresoras_codigo: ['codigo_inventario', 'Ya existe una impresora con ese código de inventario.'],
      uq_impresoras_serie: ['numero_serie', 'Ya existe una impresora con ese número de serie.'],
    },
    fkFields: {
      fk_impresoras_tipo: ['tipo_impresora_id', 'El tipo de impresora seleccionado no existe.'],
      fk_impresoras_ubicacion: ['ubicacion_id', 'La ubicación seleccionada no existe.'],
    },
  },
  celulares: {
    kind: 'celulares',
    label: 'celular',
    Label: 'Celular',
    art: 'el',
    Art: 'El',
    o: 'o',
    table: 'celulares',
    // Los celulares no tienen catalogo de tipos: todos se muestran como 'Celular'.
    tipoTable: null,
    tipoFk: null,
    tipoFixed: 'Celular',
    asigTable: 'asignaciones_celulares',
    asigFk: 'celular_id',
    vigenteCol: 'celular_vigente_id',
    prefix: 'CEL',
    imageDir: 'celulares',
    editable: [
      'marca', 'modelo', 'numero_serie', 'imei_1', 'imei_2', 'color',
      'sistema_operativo', 'almacenamiento', 'ram', 'numero_telefono', 'operador',
      'correo_asociado', 'componentes_adicionales',
      'observaciones', 'fecha_compra', 'fecha_renovacion', 'garantia_vence', 'garantia_detalle',
    ],
    dateFields: ['fecha_compra', 'fecha_renovacion', 'garantia_vence', 'fecha_baja'],
    jsonFields: ['componentes_adicionales'],
    boolFields: [],
    withHolder: true,
    titulo: "TRIM(CONCAT_WS(' ', i.marca, i.modelo))",
    searchCols: [
      'i.codigo_inventario', 'i.numero_serie', 'i.marca', 'i.modelo',
      'i.imei_1', 'i.imei_2', 'i.numero_telefono',
    ],
    uniqueFields: {
      uq_celulares_codigo: ['codigo_inventario', 'Ya existe un celular con ese código de inventario.'],
      uq_celulares_serie: ['numero_serie', 'Ya existe un celular con ese número de serie.'],
      uq_celulares_imei_1: ['imei_1', 'Ya existe un celular con ese IMEI.'],
      uq_celulares_imei_2: ['imei_2', 'Ya existe un celular con ese IMEI.'],
    },
    fkFields: {},
  },
};

// "del equipo" / "de la impresora" para armar mensajes con el genero correcto.
for (const cfg of Object.values(KINDS)) cfg.del = cfg.art === 'la' ? 'de la' : 'del';

const pad = (n) => String(n).padStart(2, '0');

function localDateString(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function localDateTimeString(d = new Date()) {
  return `${localDateString(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Convierte la fecha 'YYYY-MM-DD' capturada en el formulario a DATETIME:
 * hoy -> la hora actual; otro dia (registro retroactivo) -> 12:00 de ese dia.
 * Sin fecha -> ahora.
 */
function resolveFecha(dateStr) {
  if (!dateStr || dateStr === localDateString()) return localDateTimeString();
  return `${dateStr} 12:00:00`;
}

function formatCodigo(prefix, n) {
  return `${prefix}-${String(n).padStart(5, '0')}`;
}

module.exports = {
  ESTADOS,
  ESTADOS_MANUALES,
  CONDICIONES,
  KINDS,
  localDateString,
  localDateTimeString,
  resolveFecha,
  formatCodigo,
};
