const express = require('express');
const { body } = require('express-validator');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  cambiarEstadoUser,
  restablecerPassword,
  getPermisos,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { requirePermission } = require('../middleware/roleMiddleware');
const { passwordRules } = require('../utils/password');

const router = express.Router();

const createValidation = [
  body('name').trim().notEmpty().withMessage('El nombre es obligatorio.'),
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('El usuario debe tener entre 3 y 50 caracteres.')
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('El usuario solo puede contener letras, numeros, puntos, guiones y guion bajo.'),
  body('email').isEmail().withMessage('Ingresa un correo valido.').normalizeEmail(),
  passwordRules('password'), // politica de utils/password.js (10+ caracteres, mayuscula, minuscula, numero)
  body('role')
    .optional()
    .isIn(['admin', 'technician', 'viewer'])
    .withMessage('Rol invalido.'),
];

const updateValidation = [
  body('name').optional().trim().notEmpty().withMessage('El nombre es obligatorio.'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('El usuario debe tener entre 3 y 50 caracteres.')
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('El usuario solo puede contener letras, numeros, puntos, guiones y guion bajo.'),
  body('email').optional().isEmail().withMessage('Ingresa un correo valido.').normalizeEmail(),
  body('role').optional().isIn(['admin', 'technician', 'viewer']).withMessage('Rol invalido.'),
  body('active').optional().isBoolean().withMessage('Estado invalido.'),
];

// Todas las rutas de usuarios requieren autenticacion.
router.use(protect);

// GET / se usa tambien como catalogo (ej. responsable de un dispositivo de red),
// por eso queda a nivel STAFF; el resto de acciones son solo de administracion.
router.get('/', authorize('admin', 'technician'), getUsers);
router.get('/permisos', requirePermission('usuarios.administrar'), getPermisos);
router.get('/:id', getUserById); // control fino de permisos dentro del controlador
router.post('/', requirePermission('usuarios.administrar'), createValidation, createUser);
router.put('/:id', requirePermission('usuarios.administrar'), updateValidation, updateUser);
router.patch('/:id/estado', requirePermission('usuarios.administrar'), cambiarEstadoUser);
router.post('/:id/restablecer-password', requirePermission('usuarios.administrar'), restablecerPassword);

module.exports = router;
