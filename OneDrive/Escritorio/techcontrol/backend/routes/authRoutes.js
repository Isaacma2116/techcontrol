const express = require('express');
const { body } = require('express-validator');
const { login, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { loginLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

const loginValidation = [
  body('identifier')
    .trim()
    .notEmpty()
    .withMessage('Ingresa tu correo o nombre de usuario.'),
  body('password').notEmpty().withMessage('La contrasenia es obligatoria.'),
  body('remember').optional().isBoolean().withMessage('Valor de "remember" invalido.'),
];

router.post('/login', loginLimiter, loginValidation, login);
router.post('/logout', logout);
router.get('/me', protect, getMe);

module.exports = router;
