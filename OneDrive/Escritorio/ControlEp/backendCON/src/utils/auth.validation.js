const { check } = require('express-validator');
const { validate } = require('../middlewares/validation.middleware');

const validateRegister = validate([
  check('nombre')
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres'),
  
  check('correo')
    .notEmpty().withMessage('El correo es requerido')
    .isEmail().withMessage('Correo electrónico inválido')
    .normalizeEmail(),
  
  check('contrasena')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
]);

const validateLogin = validate([
  check('identifier')
    .notEmpty().withMessage('Correo o nombre de usuario es requerido'),
  
  check('contrasena')
    .notEmpty().withMessage('La contraseña es requerida')
]);

module.exports = { validateRegister, validateLogin };