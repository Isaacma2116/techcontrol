const express = require('express');
const { body, param, query } = require('express-validator');
const controller = require('../controllers/softwareController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { TIPOS_SOFTWARE, ESTADOS_SOFTWARE } = require('../utils/licencias');

const router = express.Router();

const idParam = [param('id').isInt({ min: 1 }).withMessage('Identificador inválido.'), validateRequest];

const softwareValidation = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio.').bail().isLength({ max: 150 }).withMessage('El nombre no puede superar 150 caracteres.'),
  body('fabricante_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Fabricante inválido.'),
  body('categoria_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Categoría inválida.'),
  body('tipo').isIn(TIPOS_SOFTWARE).withMessage('Tipo de software inválido.'),
  body('version_referencia').optional({ values: 'falsy' }).trim().isLength({ max: 40 }).withMessage('La versión no puede superar 40 caracteres.'),
  body('requiere_licencia').optional().isBoolean().withMessage('Valor inválido.'),
  body('requiere_activacion').optional().isBoolean().withMessage('Valor inválido.'),
  body('sitio_web').optional({ values: 'falsy' }).trim().isLength({ max: 190 }).withMessage('El sitio web es demasiado largo.'),
  body('descripcion').optional({ values: 'falsy' }).trim().isLength({ max: 500 }).withMessage('La descripción no puede superar 500 caracteres.'),
  body('observaciones').optional({ values: 'falsy' }).trim().isLength({ max: 2000 }).withMessage('Las observaciones no pueden superar 2000 caracteres.'),
  validateRequest,
];

const listValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional({ values: 'falsy' }).trim().isLength({ max: 120 }),
  query('tipo').optional({ values: 'falsy' }).isIn(TIPOS_SOFTWARE),
  query('estado').optional({ values: 'falsy' }).isIn(ESTADOS_SOFTWARE),
  query('requiere_licencia').optional({ values: 'falsy' }).isBoolean(),
  validateRequest,
];

router.use(protect);

// Consultar el catalogo de software: cualquier usuario con sesion.
router.get('/', requirePermission('software.ver'), listValidation, controller.list);
router.get('/stats', requirePermission('software.ver'), controller.stats);
router.get('/:id', requirePermission('software.ver'), idParam, controller.getById);
// Las licencias de un software solo las ve quien puede ver licencias (traen costos/vencimientos).
router.get('/:id/licencias', requirePermission('licencias.ver'), idParam, controller.licencias);
router.get('/:id/usuarios', requirePermission('licencias.ver'), idParam, controller.usuarios);

router.post('/', requirePermission('software.gestionar'), softwareValidation, controller.create);
router.put('/:id', requirePermission('software.gestionar'), idParam, softwareValidation, controller.update);
router.patch('/:id/estado', requirePermission('software.gestionar'), idParam, body('estado').isIn(ESTADOS_SOFTWARE).withMessage('Estado inválido.'), validateRequest, controller.setEstado);

module.exports = router;
