const express = require('express');
const { query } = require('express-validator');
const controller = require('../controllers/reporteController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { TIPOS_ACTIVO } = require('../utils/reportes');

const router = express.Router();

const DATE_FORMAT = { format: 'YYYY-MM-DD', strictMode: true, delimiters: ['-'] };

const filtrosValidation = [
  query('desde').optional({ values: 'falsy' }).isDate(DATE_FORMAT).withMessage('La fecha "desde" no es válida.'),
  query('hasta').optional({ values: 'falsy' }).isDate(DATE_FORMAT).withMessage('La fecha "hasta" no es válida.'),
  query('departamento_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Departamento inválido.'),
  query('ubicacion_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Ubicación inválida.'),
  query('tipo_activo').optional({ values: 'falsy' }).isIn(TIPOS_ACTIVO).withMessage('Tipo de activo inválido.'),
  query('estado').optional({ values: 'falsy' }).isIn(['disponible', 'asignado', 'mantenimiento', 'reparacion', 'baja', 'perdido']).withMessage('Estado inválido.'),
  validateRequest,
];

router.use(protect);

router.get('/dashboard', requirePermission('reportes.ver'), filtrosValidation, controller.dashboard);
router.get(
  '/exportar',
  requirePermission('reportes.exportar'),
  [query('formato').optional({ values: 'falsy' }).isIn(['pdf', 'excel']).withMessage('Formato inválido.'), ...filtrosValidation],
  controller.exportar
);

module.exports = router;
