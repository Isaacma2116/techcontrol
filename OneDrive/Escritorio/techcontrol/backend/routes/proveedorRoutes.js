const express = require('express');
const { body, param, query } = require('express-validator');
const controller = require('../controllers/proveedorController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

const idParam = [param('id').isInt({ min: 1 }).withMessage('Identificador inválido.'), validateRequest];

const text = (field, max, label, required = false) => {
  const rule = required ? body(field).trim().notEmpty().withMessage(`${label} es obligatorio.`) : body(field).optional({ values: 'falsy' }).trim();
  return rule.isLength({ max }).withMessage(`${label} no puede superar ${max} caracteres.`);
};

const proveedorValidation = [
  text('nombre', 150, 'El nombre', true),
  text('rfc', 20, 'El RFC'),
  text('contacto_nombre', 150, 'El nombre de contacto'),
  body('telefono').optional({ values: 'falsy' }).trim().matches(/^[0-9+()\-\s.]{7,25}$/).withMessage('Ingresa un teléfono válido.'),
  body('correo').optional({ values: 'falsy' }).trim().isEmail().withMessage('Ingresa un correo válido.').bail().isLength({ max: 190 }),
  text('sitio_web', 190, 'El sitio web'),
  text('notas', 1000, 'Las notas'),
  validateRequest,
];

router.use(protect);

router.get('/', requirePermission('licencias.ver'), query('search').optional({ values: 'falsy' }).trim().isLength({ max: 120 }), validateRequest, controller.list);
router.get('/:id', requirePermission('licencias.ver'), idParam, controller.getById);
router.post('/', requirePermission('licencias.gestionar'), proveedorValidation, controller.create);
router.put('/:id', requirePermission('licencias.gestionar'), idParam, proveedorValidation, controller.update);
router.patch('/:id/activo', requirePermission('licencias.gestionar'), idParam, body('activo').isBoolean(), validateRequest, controller.setActivo);

module.exports = router;
