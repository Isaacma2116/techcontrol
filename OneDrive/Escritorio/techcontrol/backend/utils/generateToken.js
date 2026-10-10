const jwt = require('jsonwebtoken');

const MS_IN_DAY = 24 * 60 * 60 * 1000;

/**
 * Genera un JWT firmado con la informacion minima necesaria
 * (nunca incluir la contrasenia ni datos sensibles en el payload,
 * ya que el JWT no esta encriptado, solo firmado).
 *
 * Si `remember` es true, la sesion dura mucho mas (JWT_REMEMBER_EXPIRES_IN,
 * ej. 30 dias) en vez de la duracion corta por defecto (JWT_EXPIRES_IN, ej. 8h).
 * `sessionId` (jti) enlaza el token con su sesion en user_sessions, que se puede revocar.
 */
function generateToken(user, remember = false, sessionId) {
  const expiresIn = remember
    ? process.env.JWT_REMEMBER_EXPIRES_IN || '30d'
    : process.env.JWT_EXPIRES_IN || '8h';

  return jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn, jwtid: sessionId } // jti = id de la fila en user_sessions
  );
}

/**
 * Coloca el JWT en una cookie HttpOnly.
 * - HttpOnly: JavaScript en el navegador no puede leerla (mitiga XSS).
 * - Secure: solo se envia por HTTPS (activar en produccion).
 * - SameSite=Strict: mitiga CSRF en la mayoria de los casos.
 *
 * Si `remember` es false, la cookie NO lleva maxAge: se convierte en una
 * "cookie de sesion" que el navegador borra al cerrarse, en vez de
 * persistir en disco.
 */
function setTokenCookie(res, token, remember = false) {
  const cookieName = process.env.COOKIE_NAME || 'tc_token';
  const isSecure = process.env.COOKIE_SECURE === 'true';

  const options = {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'strict',
    path: '/',
  };

  if (remember) {
    options.maxAge = 30 * MS_IN_DAY;
  }

  res.cookie(cookieName, token, options);
}

function clearTokenCookie(res) {
  const cookieName = process.env.COOKIE_NAME || 'tc_token';
  res.clearCookie(cookieName, { path: '/' });
}

module.exports = { generateToken, setTokenCookie, clearTokenCookie };
