const { body } = require('express-validator');

/**
 * Politica de contrasenas de TechControl (una sola fuente de verdad):
 * al crear usuarios, al cambiar la propia y al restablecer.
 *  - 10 a 128 caracteres, con mayuscula, minuscula y numero
 *  - sin el usuario ni la parte local del correo dentro de la contrasena
 * Las contrasenas nunca se guardan en texto plano: se hashean con bcrypt (12 rondas).
 */

const MIN_LENGTH = 10;
const MAX_LENGTH = 128;
const PASSWORD_HELP = `Usa al menos ${MIN_LENGTH} caracteres, con mayúscula, minúscula y número.`;

/** Devuelve el mensaje de error de la primera regla que incumple, o null si es valida. */
function checkPassword(password, { username, email } = {}) {
  if (typeof password !== 'string' || password.length < MIN_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_LENGTH} caracteres.`;
  }
  if (password.length > MAX_LENGTH) return `La contraseña no puede superar ${MAX_LENGTH} caracteres.`;
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'La contraseña debe incluir mayúscula, minúscula y número.';
  }

  const lower = password.toLowerCase();
  const local = (email || '').split('@')[0].toLowerCase();
  for (const forbidden of [username?.toLowerCase(), local]) {
    if (forbidden && forbidden.length >= 3 && lower.includes(forbidden)) {
      return 'La contraseña no debe contener tu usuario ni tu correo.';
    }
  }
  return null;
}

/**
 * Validador de express-validator. El usuario/correo se toman del body (crear usuario)
 * o, si no vienen, del usuario autenticado (cambio de contrasena).
 */
function passwordRules(field = 'password') {
  return body(field).custom((value, { req }) => {
    const error = checkPassword(value, {
      username: req.body.username ?? req.user?.username,
      email: req.body.email ?? req.user?.email,
    });
    if (error) throw new Error(error);
    return true;
  });
}

module.exports = { checkPassword, passwordRules, PASSWORD_HELP, MIN_LENGTH };
