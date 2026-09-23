const express = require('express');
const { body, param } = require('express-validator');
const controller = require('../controllers/perfilController');
const { protect } = require('../middleware/authMiddleware');
const { imageUploads } = require('../middleware/uploadMiddleware');
const { sensitiveLimiter } = require('../middleware/rateLimiter');
const validateRequest = require('../middleware/validateRequest');
const { passwordRules } = require('../utils/password');

const router = express.Router();

const PHONE_REGEX = /^[0-9+()\-\s.]{7,25}$/;

const perfilValidation = [
  body('nombres').trim().notEmpty().withMessage('El nombre es obligatorio.').bail()
    .isLength({ max: 100 }).withMessage('El nombre no puede superar 100 caracteres.'),
  body('apellidos').optional({ values: 'falsy' }).trim()
    .isLength({ max: 100 }).withMessage('Los apellidos no pueden superar 100 caracteres.'),
  body('telefono').optional({ values: 'falsy' }).trim()
    .matches(PHONE_REGEX).withMessage('Ingresa un teléfono válido (7 a 25 dígitos).'),
  body('cargo').optional({ values: 'falsy' }).trim()
    .isLength({ max: 100 }).withMessage('El cargo no puede superar 100 caracteres.'),
  // Sin normalizeEmail(): no debe alterar el correo (p. ej. quitar puntos en Gmail).
  body('email').trim().notEmpty().withMessage('El correo es obligatorio.').bail()
    .isEmail().withMessage('Ingresa un correo válido.').bail()
    .isLength({ max: 190 }).withMessage('El correo es demasiado largo.'),
  validateRequest,
];

const passwordValidation = [
  body('password_actual').notEmpty().withMessage('Ingresa tu contraseña actual.'),
  passwordRules('password_nueva'),
  body('password_confirmacion').custom((value, { req }) => {
    if (value !== req.body.password_nueva) throw new Error('La confirmación no coincide con la nueva contraseña.');
    return true;
  }),
  validateRequest,
];

const sessionIdParam = [param('id').isUUID().withMessage('Identificador inválido.'), validateRequest];

const preferenciasValidation = [
  body('tema').optional().isIn(['claro', 'oscuro', 'automatico']).withMessage('Tema inválido.'),
  body('densidad').optional().isIn(['comoda', 'compacta']).withMessage('Densidad inválida.'),
  body('acento').optional().isIn(['azul', 'verde', 'morado', 'naranja', 'rojo', 'rosa', 'indigo', 'cian']).withMessage('Color de acento inválido.'),
  validateRequest,
];

const verificarPasswordValidation = [
  body('password').notEmpty().withMessage('Ingresa tu contraseña.'),
  validateRequest,
];

const eliminarCuentaValidation = [
  body('password').notEmpty().withMessage('Ingresa tu contraseña.'),
  body('confirmacion').equals('ELIMINAR').withMessage('Escribe ELIMINAR para confirmar.'),
  validateRequest,
];

// Todo el perfil pertenece al usuario autenticado, cualquiera sea su rol.
router.use(protect);

router.get('/', controller.getPerfil);
router.put('/', sensitiveLimiter, perfilValidation, controller.updatePerfil);
router.put('/password', sensitiveLimiter, passwordValidation, controller.changePassword);
router.put('/preferencias', preferenciasValidation, controller.updatePreferencias);
router.post('/verificar-password', sensitiveLimiter, verificarPasswordValidation, controller.verificarPassword);

router.post('/foto', imageUploads.usuarios.middleware, controller.uploadFoto);
router.delete('/foto', controller.deleteFoto);

router.get('/sesiones', controller.getSesiones);
router.delete('/sesiones/otras', controller.closeOtherSessions); // antes de '/:id'
router.delete('/sesiones/:id', sessionIdParam, controller.closeSession);

// Zona peligrosa
router.delete('/', sensitiveLimiter, eliminarCuentaValidation, controller.eliminarCuenta);

module.exports = router;
