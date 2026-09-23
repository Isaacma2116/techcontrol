const rateLimit = require('express-rate-limit');

/**
 * Limitador especifico para el login: mitiga ataques de fuerza bruta.
 * Se aplica solo a POST /api/auth/login, no a toda la API.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos FALLIDOS por IP en la ventana (un acceso correcto no cuenta: varios equipos detras de una misma IP no se bloquean)
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiados intentos de inicio de sesion. Intenta de nuevo en unos minutos.',
  },
});

/**
 * Limitador de acciones sensibles del usuario autenticado (cambiar contrasena o correo).
 * Cuenta SOLO los intentos con la contrasena actual incorrecta (el controlador marca
 * res.locals.wrongPassword): editar el perfil con normalidad no consume el limite, pero
 * nadie puede adivinar la contrasena a traves de estos endpoints. Se cuenta por usuario
 * (no por IP): compartir una IP no bloquea a otros.
 */
const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  requestWasSuccessful: (req, res) => !res.locals.wrongPassword,
  keyGenerator: (req) => `user:${req.user?.id ?? 'anon'}`,
  message: {
    success: false,
    message: 'Demasiados intentos con la contraseña incorrecta. Espera unos minutos antes de volver a intentarlo.',
  },
});

module.exports = { loginLimiter, sensitiveLimiter };
