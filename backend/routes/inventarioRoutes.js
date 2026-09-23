const express = require('express');
const { body, param, query } = require('express-validator');
const { makeInventarioController } = require('../controllers/inventarioController');
const { protect } = require('../middleware/authMiddleware');
const { authorize, requirePermission } = require('../middleware/roleMiddleware');
const { requireReciente } = require('../middleware/reautenticacion');
const { imageUploads } = require('../middleware/uploadMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { ESTADOS, ESTADOS_MANUALES, KINDS, localDateString } = require('../utils/inventario');

const DATE_FORMAT = { format: 'YYYY-MM-DD', strictMode: true, delimiters: ['-'] };
const CODE_REGEX = /^[A-Za-z0-9._-]+$/;
const HOSTNAME_REGEX = /^[A-Za-z0-9._-]+$/;
const PHONE_REGEX = /^[0-9+()\-\s.]{7,25}$/;
const ESTADO_FISICO = ['excelente', 'bueno', 'regular', 'malo'];
const TIPOS_CONEXION = ['usb', 'red', 'wifi'];

const idParam = [param('id').isInt({ min: 1 }).withMessage('Identificador inválido.'), validateRequest];

const text = (field, max, label) =>
  body(field).optional({ values: 'falsy' }).trim()
    .isLength({ max }).withMessage(`${label} no puede superar ${max} caracteres.`);

const optionalDate = (field, label) =>
  body(field).optional({ values: 'falsy' }).isDate(DATE_FORMAT).withMessage(`${label} no es válida.`);

// IMEI: 15 digitos con digito verificador (Luhn); al capturarlo se aceptan espacios y guiones.
const isValidImei = (value) => {
  const digits = String(value).replace(/[\s-]/g, '');
  if (!/^\d{15}$/.test(digits)) return false;
  const sum = [...digits].reverse().reduce((acc, ch, i) => {
    let n = Number(ch);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    return acc + n;
  }, 0);
  return sum % 10 === 0;
};

const imeiRule = (field) =>
  body(field).optional({ values: 'falsy' }).trim().custom((v) => {
    if (!isValidImei(v)) throw new Error('El IMEI debe tener 15 dígitos válidos.');
    return true;
  });

// Reglas que comparten varios tipos de inventario.
const codigoRule = body('codigo_inventario').optional({ values: 'falsy' }).trim()
  .isLength({ max: 60 }).withMessage('El código no puede superar 60 caracteres.').bail()
  .matches(CODE_REGEX).withMessage('Solo letras, números, puntos, guiones y guion bajo.');

const macRule = body('mac_address').optional({ values: 'falsy' }).trim().custom((v) => {
  if (!/^[0-9a-f]{12}$/i.test(String(v).replace(/[:\-.\s]/g, ''))) throw new Error('La MAC debe tener 12 dígitos hexadecimales (AA:BB:CC:DD:EE:FF).');
  return true;
});

const hostnameRule = body('hostname').optional({ values: 'falsy' }).trim()
  .isLength({ max: 63 }).withMessage('El hostname no puede superar 63 caracteres.').bail()
  .matches(HOSTNAME_REGEX).withMessage('El hostname solo admite letras, números, puntos, guiones y guion bajo.');

const componentesRule = body('componentes_adicionales').optional({ values: 'null' }).custom((v) => {
  if (v === '') return true;
  if (!Array.isArray(v) || v.length > 20 || v.some((c) => typeof c !== 'string' || c.length > 120)) {
    throw new Error('Componentes adicionales: máximo 20 elementos de hasta 120 caracteres.');
  }
  return true;
});

const listValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Página inválida.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite inválido.'),
  query('tipo').optional({ values: 'falsy' }).isLength({ max: 60 }).withMessage('Tipo inválido.'),
  query('marca').optional({ values: 'falsy' }).isLength({ max: 80 }).withMessage('Marca inválida.'),
  query('colaborador_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Colaborador inválido.'),
  query('ubicacion_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Ubicación inválida.'),
  query('asignacion').optional({ values: 'falsy' }).isIn(['con', 'sin']).withMessage('Filtro de asignación inválido.'),
  query('estado').optional({ values: 'falsy' }).custom((value) => {
    if (!String(value).split(',').every((e) => ESTADOS.includes(e))) throw new Error('Estado inválido.');
    return true;
  }),
  validateRequest,
];

const estadoValidation = [
  body('estado').isIn(ESTADOS_MANUALES).withMessage(
    `Estado inválido. Usa: ${ESTADOS_MANUALES.join(', ')}. (Para "asignado" utiliza la asignación.)`
  ),
  body('observaciones').optional({ values: 'falsy' }).trim().isLength({ max: 500 }).withMessage('Las observaciones no pueden superar 500 caracteres.'),
  validateRequest,
];

// Reglas por tipo. Los formularios siempre envian todos los campos.
const RULES = {
  equipos: [
    codigoRule,
    body('tipo_equipo_id').isInt({ min: 1 }).withMessage('Selecciona el tipo de equipo.').toInt(),
    text('marca', 80, 'La marca'),
    text('modelo', 120, 'El modelo'),
    text('numero_serie', 120, 'El número de serie'),
    text('procesador', 120, 'El procesador'),
    text('ram', 60, 'La RAM'),
    text('disco_duro', 120, 'El disco'),
    text('tarjeta_madre', 120, 'La tarjeta madre'),
    text('tarjeta_grafica', 120, 'La tarjeta gráfica'),
    text('sistema_operativo', 80, 'El sistema operativo'),
    macRule,
    hostnameRule,
    componentesRule,
    body('estado_fisico').optional({ values: 'falsy' }).isIn(ESTADO_FISICO).withMessage('Estado físico inválido.'),
    text('observaciones', 5000, 'Las observaciones'),
    optionalDate('fecha_compra', 'La fecha de compra'),
    optionalDate('garantia_vence', 'La fecha de vencimiento de garantía'),
    text('garantia_detalle', 120, 'El detalle de garantía'),
    // Sin trim ni 'falsy': '' significa "borrar la contraseña guardada" (ver inventarioModel.update).
    body('password_equipo').optional({ values: 'null' }).isLength({ max: 128 }).withMessage('La contraseña es demasiado larga.'),
  ],
  accesorios: [
    codigoRule,
    body('tipo_accesorio_id').isInt({ min: 1 }).withMessage('Selecciona el tipo de accesorio.').toInt(),
    body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio.').bail()
      .isLength({ max: 150 }).withMessage('El nombre no puede superar 150 caracteres.'),
    text('marca', 80, 'La marca'),
    text('modelo', 120, 'El modelo'),
    text('numero_serie', 120, 'El número de serie'),
    text('observaciones', 5000, 'Las observaciones'),
    optionalDate('fecha_compra', 'La fecha de compra'),
    optionalDate('garantia_vence', 'La fecha de vencimiento de garantía'),
  ],
  impresoras: [
    codigoRule,
    body('tipo_impresora_id').isInt({ min: 1 }).withMessage('Selecciona el tipo de impresora.').toInt(),
    text('marca', 80, 'La marca'),
    text('modelo', 120, 'El modelo'),
    text('numero_serie', 120, 'El número de serie'),
    body('ip').optional({ values: 'falsy' }).trim().isIP().withMessage('La dirección IP no es válida.'),
    macRule,
    hostnameRule,
    body('ubicacion_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Ubicación inválida.'),
    body('tipo_conexion').optional({ values: 'falsy' }).isIn(TIPOS_CONEXION).withMessage('Tipo de conexión inválido.'),
    body('imprime_color').optional().isBoolean().withMessage('Valor inválido para "imprime a color".'),
    body('duplex').optional().isBoolean().withMessage('Valor inválido para "dúplex".'),
    body('contador_impresiones').optional({ values: 'falsy' })
      .isInt({ min: 0, max: 4294967295 }).withMessage('El contador debe ser un número entero mayor o igual a 0.'),
    text('observaciones', 5000, 'Las observaciones'),
    optionalDate('fecha_compra', 'La fecha de compra'),
    optionalDate('garantia_vence', 'La fecha de vencimiento de garantía'),
    text('garantia_detalle', 120, 'El detalle de garantía'),
  ],
  // Los celulares no llevan contraseñas ni PIN: el inventario no las guarda.
  celulares: [
    codigoRule,
    text('marca', 80, 'La marca'),
    text('modelo', 120, 'El modelo'),
    text('numero_serie', 120, 'El número de serie'),
    imeiRule('imei_1'),
    imeiRule('imei_2').custom((v, { req }) => {
      if (String(v).replace(/[\s-]/g, '') === String(req.body.imei_1 || '').replace(/[\s-]/g, '')) {
        throw new Error('El IMEI 2 no puede ser igual al IMEI 1.');
      }
      return true;
    }),
    text('color', 40, 'El color'),
    text('sistema_operativo', 80, 'El sistema operativo'),
    text('almacenamiento', 60, 'El almacenamiento'),
    text('ram', 60, 'La RAM'),
    body('numero_telefono').optional({ values: 'falsy' }).trim()
      .matches(PHONE_REGEX).withMessage('Ingresa un número de teléfono válido (7 a 25 dígitos).'),
    text('operador', 60, 'El operador'),
    body('correo_asociado').optional({ values: 'falsy' }).trim()
      .isEmail().withMessage('Ingresa un correo válido.').bail()
      .isLength({ max: 190 }).withMessage('El correo es demasiado largo.'),
    componentesRule,
    text('observaciones', 5000, 'Las observaciones'),
    optionalDate('fecha_compra', 'La fecha de compra'),
    optionalDate('fecha_renovacion', 'La fecha de renovación'),
    optionalDate('garantia_vence', 'La fecha de vencimiento de garantía'),
    text('garantia_detalle', 120, 'El detalle de garantía'),
  ],
};

// Equipos, impresoras y celulares: asignacion opcional al crear/editar ("Colaborador actual").
const HOLDER_RULES = [
  body('colaborador_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Colaborador inválido.'),
  body('fecha_asignacion').optional({ values: 'falsy' }).isDate(DATE_FORMAT).withMessage('La fecha de asignación no es válida.').bail()
    .custom((v) => {
      if (v > localDateString()) throw new Error('La fecha de asignación no puede ser futura.');
      return true;
    }),
  text('observaciones_asignacion', 1000, 'Las observaciones de la asignación'),
];

function makeInventarioRouter(kind) {
  const router = express.Router();
  const controller = makeInventarioController(kind);
  const uploads = imageUploads[kind];
  const writeRules = [
    ...RULES[kind],
    ...(KINDS[kind].withHolder ? HOLDER_RULES : []),
    validateRequest,
  ];

  // Lectura: cualquier usuario con sesion. Escritura: admin y tecnico.
  router.use(protect);
  const canWrite = authorize('admin', 'technician');

  // Rutas fijas antes de '/:id'
  router.get('/stats', controller.stats);
  router.get('/marcas', controller.marcas);
  router.get('/', listValidation, controller.list);
  router.post('/', canWrite, writeRules, controller.create);

  router.get('/:id', idParam, controller.getById);
  router.put('/:id', canWrite, idParam, writeRules, controller.update);
  router.patch('/:id/estado', canWrite, idParam, estadoValidation, controller.setEstado);
  router.get('/:id/historial', idParam, controller.getHistorial);
  router.post('/:id/imagen', canWrite, idParam, uploads.middleware, controller.uploadImagen);
  router.delete('/:id/imagen', canWrite, idParam, controller.deleteImagen);

  // Revelar la contrasena del equipo: permiso aparte (equipos.ver_contrasenas) + (si la
  // empresa activo la politica) haber confirmado la contrasena hace poco (mismo patron
  // que redes.ver_contrasenas, ver routes/redRoutes.js).
  if (KINDS[kind].withPassword) {
    router.post(
      '/:id/password',
      requirePermission(`${kind}.ver_contrasenas`),
      requireReciente(),
      idParam,
      validateRequest,
      controller.revelarPassword
    );
  }

  return router;
}

module.exports = { makeInventarioRouter, KINDS };
