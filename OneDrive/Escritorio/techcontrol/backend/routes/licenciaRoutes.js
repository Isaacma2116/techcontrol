const express = require('express');
const { body, param, query } = require('express-validator');
const controller = require('../controllers/licenciaController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { PERIODICIDADES, ESTADOS_LICENCIA, ESTADOS_LICENCIA_EFECTIVOS } = require('../utils/licencias');

const router = express.Router();

const DATE_FORMAT = { format: 'YYYY-MM-DD', strictMode: true, delimiters: ['-'] };
const idParam = [param('id').isInt({ min: 1 }).withMessage('Identificador inválido.'), validateRequest];
const idsParam = [
  param('id').isInt({ min: 1 }).withMessage('Identificador inválido.'),
  param('asignacionId').isInt({ min: 1 }).withMessage('Identificador inválido.'),
  validateRequest,
];

const optionalDate = (field, label) =>
  body(field).optional({ values: 'falsy' }).isDate(DATE_FORMAT).withMessage(`${label} no es válida.`);

const licenciaValidation = [
  body('software_id').isInt({ min: 1 }).withMessage('Selecciona el software.'),
  body('modelo_id').isInt({ min: 1 }).withMessage('Selecciona el modelo de licencia.'),
  body('proveedor_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Proveedor inválido.'),
  body('cantidad_total').isInt({ min: 1, max: 10000 }).withMessage('La cantidad debe ser un número entre 1 y 10,000.'),
  body('activaciones_maximas').optional({ values: 'falsy' }).isInt({ min: 1, max: 10000 }).withMessage('Las activaciones máximas deben ser un número válido.'),
  body('transferible').optional().isBoolean().withMessage('Valor inválido.'),
  optionalDate('fecha_compra', 'La fecha de compra'),
  optionalDate('fecha_inicio', 'La fecha de inicio'),
  optionalDate('fecha_vencimiento', 'La fecha de vencimiento'),
  body('periodicidad').optional({ values: 'falsy' }).isIn(PERIODICIDADES).withMessage('Periodicidad inválida.'),
  body('renovacion_automatica').optional().isBoolean().withMessage('Valor inválido.'),
  body('costo').optional({ values: 'falsy' }).isFloat({ min: 0, max: 99999999.99 }).withMessage('El costo debe ser un número mayor o igual a cero.'),
  body('moneda').optional({ values: 'falsy' }).trim().isLength({ min: 3, max: 3 }).withMessage('La moneda debe ser un código de 3 letras (MXN, USD…).'),
  body('numero_contrato').optional({ values: 'falsy' }).trim().isLength({ max: 80 }).withMessage('El número de contrato no puede superar 80 caracteres.'),
  body('numero_factura').optional({ values: 'falsy' }).trim().isLength({ max: 80 }).withMessage('El número de factura no puede superar 80 caracteres.'),
  body('observaciones').optional({ values: 'falsy' }).trim().isLength({ max: 2000 }).withMessage('Las observaciones no pueden superar 2000 caracteres.'),
  validateRequest,
];

// Renovar solo pide lo que cambia (normalmente fechas y costo): el resto se
// hereda de la licencia anterior (ver licenciaModel.renovar).
const renovarValidation = [
  body('software_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Software inválido.'),
  body('modelo_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Modelo inválido.'),
  body('proveedor_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Proveedor inválido.'),
  body('cantidad_total').optional({ values: 'falsy' }).isInt({ min: 1, max: 10000 }).withMessage('La cantidad debe ser un número entre 1 y 10,000.'),
  body('activaciones_maximas').optional({ values: 'falsy' }).isInt({ min: 1, max: 10000 }).withMessage('Las activaciones máximas deben ser un número válido.'),
  body('transferible').optional().isBoolean().withMessage('Valor inválido.'),
  optionalDate('fecha_compra', 'La fecha de compra'),
  optionalDate('fecha_inicio', 'La fecha de inicio'),
  optionalDate('fecha_vencimiento', 'La fecha de vencimiento'),
  body('periodicidad').optional({ values: 'falsy' }).isIn(PERIODICIDADES).withMessage('Periodicidad inválida.'),
  body('renovacion_automatica').optional().isBoolean().withMessage('Valor inválido.'),
  body('costo').optional({ values: 'falsy' }).isFloat({ min: 0, max: 99999999.99 }).withMessage('El costo debe ser un número mayor o igual a cero.'),
  body('moneda').optional({ values: 'falsy' }).trim().isLength({ min: 3, max: 3 }).withMessage('La moneda debe ser un código de 3 letras (MXN, USD…).'),
  body('numero_contrato').optional({ values: 'falsy' }).trim().isLength({ max: 80 }).withMessage('El número de contrato no puede superar 80 caracteres.'),
  body('numero_factura').optional({ values: 'falsy' }).trim().isLength({ max: 80 }).withMessage('El número de factura no puede superar 80 caracteres.'),
  body('observaciones').optional({ values: 'falsy' }).trim().isLength({ max: 2000 }).withMessage('Las observaciones no pueden superar 2000 caracteres.'),
  validateRequest,
];

const listValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional({ values: 'falsy' }).trim().isLength({ max: 120 }),
  query('software_id').optional({ values: 'falsy' }).isInt({ min: 1 }),
  query('modelo_id').optional({ values: 'falsy' }).isInt({ min: 1 }),
  query('proveedor_id').optional({ values: 'falsy' }).isInt({ min: 1 }),
  query('estado').optional({ values: 'falsy' }).isIn(ESTADOS_LICENCIA_EFECTIVOS).withMessage('Estado inválido.'),
  query('vence_en_dias').optional({ values: 'falsy' }).isInt({ min: 1, max: 3650 }),
  validateRequest,
];

const asignarValidation = [
  body('colaborador_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Colaborador inválido.'),
  body('equipo_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Equipo inválido.'),
  body('identificador_activacion').optional({ values: 'falsy' }).trim().isLength({ max: 150 }).withMessage('Máximo 150 caracteres.'),
  body('observaciones').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }).withMessage('Máximo 1000 caracteres.'),
  validateRequest,
];

const liberarValidation = [
  body('observaciones').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }).withMessage('Máximo 1000 caracteres.'),
  validateRequest,
];

router.use(protect);

router.get('/', requirePermission('licencias.ver'), listValidation, controller.list);
router.get('/stats', requirePermission('licencias.ver'), controller.stats);
router.get('/:id', requirePermission('licencias.ver'), idParam, controller.getById);
router.get('/:id/asignaciones', requirePermission('licencias.ver'), idParam, controller.asignaciones);
router.get('/:id/historial', requirePermission('licencias.ver'), idParam, controller.historial);

router.post('/', requirePermission('licencias.gestionar'), licenciaValidation, controller.create);
router.put('/:id', requirePermission('licencias.gestionar'), idParam, licenciaValidation, controller.update);
router.post('/:id/renovar', requirePermission('licencias.gestionar'), idParam, renovarValidation, controller.renovar);
router.patch(
  '/:id/estado',
  requirePermission('licencias.gestionar'),
  idParam,
  body('estado').isIn(ESTADOS_LICENCIA).withMessage('Estado inválido.'),
  validateRequest,
  (req, res, next) => (req.body.estado === 'cancelada' ? requirePermission('licencias.cancelar')(req, res, next) : next()),
  controller.setEstado
);

router.post('/:id/asignaciones', requirePermission('licencias.asignar'), idParam, asignarValidation, controller.asignar);
router.post('/:id/asignaciones/:asignacionId/liberar', requirePermission('licencias.asignar'), idsParam, liberarValidation, controller.liberar);
router.post('/:id/asignaciones/:asignacionId/transferir', requirePermission('licencias.asignar'), idsParam, asignarValidation, controller.transferir);

module.exports = router;
