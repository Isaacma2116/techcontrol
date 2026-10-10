const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const userModel = require('../models/userModel');
const sessionModel = require('../models/sessionModel');

/**
 * Middleware "protect": exige un JWT valido en la cookie HttpOnly Y una sesion
 * vigente en user_sessions (el token lleva su id, `jti`). Asi cerrar sesion, cerrar
 * "otras sesiones" o cambiar la contrasena invalidan los tokens al instante.
 * Esta es la UNICA fuente de verdad para saber si un request esta
 * autenticado; el frontend nunca decide esto por si mismo.
 */
const protect = asyncHandler(async (req, res, next) => {
  const cookieName = process.env.COOKIE_NAME || 'tc_token';
  const token = req.cookies ? req.cookies[cookieName] : null;

  if (!token) {
    throw new AppError('No autenticado. Inicia sesion para continuar.', 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new AppError('Sesion invalida o expirada. Inicia sesion nuevamente.', 401);
  }

  // Tokens anteriores a las sesiones (sin jti) ya no son validos: hay que iniciar sesion de nuevo.
  if (!decoded.jti || !(await sessionModel.findValid(decoded.jti, decoded.sub))) {
    throw new AppError('Tu sesion se cerro o expiro. Inicia sesion nuevamente.', 401);
  }

  const user = await userModel.findById(decoded.sub);

  if (!user || !user.active) {
    throw new AppError('Cuenta no encontrada o inactiva.', 401);
  }

  sessionModel.touch(decoded.jti).catch(() => {}); // "ultimo acceso" (maximo cada 5 min)

  // Adjuntamos el usuario (sin password_hash) y el id de su sesion al request
  req.user = user;
  req.sessionId = decoded.jti;
  next();
});

module.exports = { protect };
