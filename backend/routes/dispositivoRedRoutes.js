const express = require('express');
const { body, param, query } = require('express-validator');
const controller = require('../controllers/dispositivoRedController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/roleMiddleware');
const { imageUploads } = require('../middleware/uploadMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { TIPOS_DISPOSITIVO, ESTADOS_DISPOSITIVO } = require('../utils/redes');

const router = express.Router();

const DATE_FORMAT = { format: 'YYYY-MM-DD', strictMode: true, delimiters: ['-'] };
const idParam = [param('id').isInt({ min: 1 }).withMessage('Identificador inválido.'), validateRequest];

const text = (field, max, label) =>
  body(field).optional({ values: 'falsy' }).trim().isLength({ max }).withMessage(`${label} no puede superar ${max} caracteres.`);
const optionalDate = (field, label) =>
  body(field).optional({ values: 'falsy' }).isDate(DATE_FORMAT).withMessage(`${label} no es válida.`);

const IP_REGEX = /^(\d{1,3}\.){3}\d{1,3}$|^[0-9a-f:]+$/i;

const macRule = body('mac_address').optional({ values: 'falsy' }).trim().custom((v) => {
  if (!/^[0-9a-f]{12}$/i.test(String(v).replace(/[:\-.\s]/g, ''))) throw new Error('La MAC debe tener 12 dígitos hexadecimales (AA:BB:CC:DD:EE:FF).');
  return true;
});

const dispositivoValidation = [
  body('nombre').trim().notEmpty().withMessage('El nombre o identificador es obligatorio.').bail()
    .isLength({ max: 150 }).withMessage('El nombre no puede superar 150 caracteres.'),
  body('tipo').isIn(TIPOS_DISPOSITIVO).withMessage('Tipo de dispositivo inválido.'),
  text('marca', 80, 'La marca'),
  text('modelo', 120, 'El modelo'),
  text('numero_serie', 120, 'El número de serie'),
  macRule,
  body('ip_address').optional({ values: 'falsy' }).trim().matches(IP_REGEX).withMessage('Ingresa una IP válida.'),
  body('ip_publica').optional({ values: 'falsy' }).trim().matches(IP_REGEX).withMessage('Ingresa una IP válida.'),
  body('ubicacion_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Ubicación inválida.'),
  text('rack', 80, 'El rack/gabinete'),
  text('puerto', 40, 'El puerto'),
  body('vlan_admin_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('VLAN inválida.'),
  body('responsable_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Responsable inválido.'),
  optionalDate('fecha_instalacion', 'La fecha de instalación'),
  optionalDate('fecha_garantia', 'La fecha de garantía'),
  body('proveedor_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Proveedor inválido.'),
  text('observaciones', 2000, 'Las observaciones'),
  validateRequest,
];

const listValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 200 }),
  query('search').optional({ values: 'falsy' }).trim().isLength({ max: 120 }),
  query('tipo').optional({ values: 'falsy' }).isIn(TIPOS_DISPOSITIVO),
  query('estado').optional({ values: 'falsy' }).isIn(ESTADOS_DISPOSITIVO),
  query('ubicacion_id').optional({ values: 'falsy' }).isInt({ min: 1 }),
  query('red_id').optional({ values: 'falsy' }).isInt({ min: 1 }),
  validateRequest,
];

router.use(protect);

router.get('/', requirePermission('redes.ver'), listValidation, controller.list);
router.get('/stats', requirePermission('redes.ver'), controller.stats);
router.get('/conexiones', requirePermission('redes.ver'), controller.conexiones);
router.get('/:id', requirePermission('redes.ver'), idParam, controller.getById);
router.get('/:id/redes', requirePermission('redes.ver'), idParam, controller.redesAsociadas);
router.get('/:id/historial', requirePermission('redes.ver'), idParam, controller.historial);

router.post('/', requirePermission('dispositivos_red.crear'), dispositivoValidation, controller.create);
router.put('/:id', requirePermission('dispositivos_red.editar'), idParam, dispositivoValidation, controller.update);
router.patch(
  '/:id/estado',
  requirePermission('dispositivos_red.editar'),
  idParam,
  body('estado').isIn(ESTADOS_DISPOSITIVO).withMessage('Estado inválido.'),
  validateRequest,
  (req, res, next) => (req.body.estado === 'baja' ? requirePermission('dispositivos_red.eliminar')(req, res, next) : next()),
  controller.setEstado
);
router.post('/:id/imagen', requirePermission('dispositivos_red.editar'), idParam, imageUploads['dispositivos-red'].middleware, controller.uploadImagen);
router.delete('/:id/imagen', requirePermission('dispositivos_red.editar'), idParam, controller.deleteImagen);

router.post(
  '/:id/redes',
  requirePermission('dispositivos_red.editar'),
  idParam,
  body('red_id').isInt({ min: 1 }).withMessage('Selecciona la red.'),
  validateRequest,
  controller.asociarRed
);
router.delete(
  '/:id/redes/:redId',
  requirePermission('dispositivos_red.editar'),
  idParam,
  param('redId').isInt({ min: 1 }).withMessage('Identificador inválido.'),
  validateRequest,
  controller.desasociarRed
);

module.exports = router;
