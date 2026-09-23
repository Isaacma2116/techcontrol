const express = require('express');
const { body, param, query } = require('express-validator');
const controller = require('../controllers/cartaController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { documentUploads } = require('../middleware/uploadMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { RECURSOS, ESTADOS_CARTA } = require('../utils/cartas');
const { localDateString } = require('../utils/inventario');

const router = express.Router();

const DATE_FORMAT = { format: 'YYYY-MM-DD', strictMode: true, delimiters: ['-'] };
const TIPOS = Object.keys(RECURSOS);

const idParam = [param('id').isInt({ min: 1 }).withMessage('Identificador inválido.'), validateRequest];

const listValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Página inválida.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite inválido.'),
  query('tipo').optional({ values: 'falsy' }).isIn(TIPOS).withMessage('Tipo de recurso inválido.'),
  query('estado').optional({ values: 'falsy' }).custom((v) => {
    if (!String(v).split(',').every((e) => ESTADOS_CARTA.includes(e))) throw new Error('Estado inválido.');
    return true;
  }),
  query('desde').optional({ values: 'falsy' }).isDate(DATE_FORMAT).withMessage('Fecha inicial inválida.'),
  query('hasta').optional({ values: 'falsy' }).isDate(DATE_FORMAT).withMessage('Fecha final inválida.'),
  query('area_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Área inválida.'),
  validateRequest,
];

const text = (field, max, label) =>
  body(field).optional({ values: 'falsy' }).trim().isLength({ max }).withMessage(`${label} no puede superar ${max} caracteres.`);

// Crear y editar un borrador comparten reglas.
const cartaValidation = [
  body('colaborador_id').isInt({ min: 1 }).withMessage('Selecciona el colaborador.').toInt(),
  body('items').isArray({ min: 1, max: 20 }).withMessage('Selecciona entre 1 y 20 recursos.'),
  body('items.*.tipo').isIn(TIPOS).withMessage('Tipo de recurso inválido.'),
  body('items.*.asignacion_id').isInt({ min: 1 }).withMessage('Asignación inválida.').toInt(),
  body('fecha_entrega').notEmpty().withMessage('La fecha de entrega es obligatoria.').bail()
    .isDate(DATE_FORMAT).withMessage('La fecha de entrega no es válida.'),
  body('fecha_devolucion_esperada').optional({ values: 'falsy' })
    .isDate(DATE_FORMAT).withMessage('La fecha de devolución no es válida.').bail()
    .custom((v, { req }) => {
      if (req.body.fecha_entrega && v < req.body.fecha_entrega) {
        throw new Error('La devolución esperada no puede ser anterior a la entrega.');
      }
      return true;
    }),
  text('observaciones', 2000, 'Las observaciones'),
  text('condiciones_especiales', 2000, 'Las condiciones especiales'),
  text('entrega_nombre', 150, 'El nombre'),
  text('entrega_cargo', 150, 'El cargo'),
  validateRequest,
];

const cancelarValidation = [
  text('motivo', 500, 'El motivo'),
  validateRequest,
];

const fechaFirmaValidation = [
  body('fecha_firma').optional({ values: 'falsy' })
    .isDate(DATE_FORMAT).withMessage('La fecha de firma no es válida.').bail()
    .custom((v) => {
      if (v > localDateString()) throw new Error('La fecha de firma no puede ser futura.');
      return true;
    }),
  validateRequest,
];

// Si la validacion falla despues de recibir el archivo, se borra (no dejar huerfanos).
const removeUploadOnError = (err, req, res, next) => {
  if (req.file) documentUploads.cartas.remove(req.file.filename);
  next(err);
};

// Las cartas contienen datos personales: solo administradores y tecnicos.
// Las acciones que ademas exigen ser admin (reemplazar/cancelar una firmada) se validan en el modelo.
router.use(protect, authorize('admin', 'technician'));

router.get('/stats', controller.stats);
router.get('/', listValidation, controller.list);
router.post('/', cartaValidation, controller.create);

router.get('/:id', idParam, controller.getById);
router.put('/:id', idParam, cartaValidation, controller.update);
router.get('/:id/historial', idParam, controller.getHistorial);
router.get('/:id/preview', idParam, controller.preview);
router.post('/:id/generar', idParam, controller.generar);
router.get('/:id/pdf', idParam, controller.getPdf);
router.post('/:id/firmada', idParam, documentUploads.cartas.middleware, fechaFirmaValidation, controller.subirFirmada, removeUploadOnError);
router.get('/:id/firmada', idParam, controller.getFirmada);
router.get('/:id/documentos/:docId', authorize('admin'), idParam, param('docId').isInt({ min: 1 }), validateRequest, controller.getDocumento);
router.post('/:id/cancelar', idParam, cancelarValidation, controller.cancelar);

module.exports = router;
