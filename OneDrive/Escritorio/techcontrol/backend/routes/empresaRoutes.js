const express = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/empresaController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { documentUploads } = require('../middleware/uploadMiddleware');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

const PHONE_REGEX = /^[0-9+()\-\s.]{7,25}$/;

const opt = (field, max, label) =>
  body(field).optional({ values: 'falsy' }).trim().isLength({ max }).withMessage(`${label} no puede superar ${max} caracteres.`);

const empresaValidation = [
  body('nombre').trim().notEmpty().withMessage('El nombre de la empresa es obligatorio.').bail()
    .isLength({ max: 150 }).withMessage('El nombre no puede superar 150 caracteres.'),
  body('rfc').optional({ values: 'falsy' }).trim()
    .matches(/^[A-Za-z0-9&Ññ]{10,20}$/).withMessage('El RFC solo admite letras y números (10 a 20 caracteres).'),
  opt('direccion', 255, 'La dirección'),
  body('telefono').optional({ values: 'falsy' }).trim().matches(PHONE_REGEX).withMessage('Ingresa un teléfono válido (7 a 25 dígitos).'),
  body('correo').optional({ values: 'falsy' }).trim()
    .isEmail().withMessage('Ingresa un correo válido.').bail()
    .isLength({ max: 190 }).withMessage('El correo es demasiado largo.'),
  body('sitio_web').optional({ values: 'falsy' }).trim()
    .isLength({ max: 190 }).withMessage('El sitio web es demasiado largo.').bail()
    .isURL({ require_protocol: false, protocols: ['http', 'https'] }).withMessage('Ingresa un sitio web válido.'),
  opt('pie_documento', 255, 'El pie de página'),
  opt('entrega_nombre', 150, 'El nombre'),
  opt('entrega_cargo', 150, 'El cargo'),
  body('folio_prefijo').optional({ values: 'falsy' }).trim()
    .matches(/^[A-Za-z0-9]{1,10}$/).withMessage('El prefijo del folio admite de 1 a 10 letras o números.'),
  opt('descripcion', 500, 'La descripción'),
  opt('encabezado_documento', 255, 'El encabezado'),
  body('formato_fecha').optional({ values: 'falsy' }).isIn(['larga', 'corta']).withMessage('Formato de fecha inválido.'),
  opt('texto_declaracion', 5000, 'La declaración'),
  opt('texto_condiciones', 5000, 'Las condiciones'),
  validateRequest,
];

router.use(protect);

// El logo lo puede ver cualquier usuario con sesion (lo usan las pantallas y los PDF).
router.get('/logo', controller.getLogo);

// Los datos de la empresa: admin y tecnico consultan (las cartas los usan); solo admin modifica.
router.get('/', authorize('admin', 'technician'), controller.get);
router.put('/', authorize('admin'), empresaValidation, controller.update);
router.patch(
  '/politica-seguridad',
  authorize('admin'),
  body('requiere_reautenticacion_sensible').isBoolean().withMessage('Valor inválido.'),
  validateRequest,
  controller.updatePoliticaSeguridad
);
router.post('/logo', authorize('admin'), documentUploads.logo.middleware, controller.uploadLogo);
router.delete('/logo', authorize('admin'), controller.deleteLogo);

module.exports = router;
