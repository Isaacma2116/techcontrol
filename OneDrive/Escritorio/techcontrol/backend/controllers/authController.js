const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const userModel = require('../models/userModel');
const sessionModel = require('../models/sessionModel');
const { withPermissions } = require('../utils/permisos');
const {
  generateToken,
  setTokenCookie,
  clearTokenCookie,
} = require('../utils/generateToken');

/**
 * POST /api/auth/login
 * Acepta `identifier` (correo O nombre de usuario) + `password` + `remember`.
 * Valida credenciales en el backend, nunca en el frontend.
 * Crea una SESION (user_sessions) y coloca el JWT, que lleva su id, en una cookie
 * HttpOnly. El cuerpo de la respuesta NUNCA incluye la contrasenia ni su hash.
 */
const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { identifier, password, remember } = req.body;
  const rememberSession = remember === true || remember === 'true';

  const user = await userModel.findByIdentifierWithPassword(identifier.trim());

  // Mensaje generico a proposito: no revelar si el correo/usuario existe o no.
  const invalidCredentialsMessage = 'Correo, usuario o contrasenia incorrectos.';

  if (!user) {
    throw new AppError(invalidCredentialsMessage, 401);
  }

  if (!user.active) {
    throw new AppError('Esta cuenta se encuentra inactiva. Contacta al administrador.', 403);
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    throw new AppError(invalidCredentialsMessage, 401);
  }

  // Sesion nueva: su id viaja en el token y se puede revocar (cerrar sesion, cerrar otras...).
  const sessionId = crypto.randomUUID();
  const token = generateToken(user, rememberSession, sessionId);
  await sessionModel.create({
    id: sessionId,
    userId: user.id,
    userAgent: req.get('user-agent'),
    ip: req.ip,
    expiresAt: new Date(jwt.decode(token).exp * 1000),
  });
  sessionModel.purgeOld().catch(() => {}); // limpieza oportunista; no bloquea el login

  setTokenCookie(res, token, rememberSession);
  await userModel.updateLastLogin(user.id);

  const publicUser = await userModel.findById(user.id);

  res.status(200).json({
    success: true,
    message: 'Inicio de sesion exitoso.',
    data: { user: withPermissions(publicUser) },
  });
});

/**
 * POST /api/auth/logout
 * Revoca la sesion actual (si el token es valido) y limpia la cookie.
 */
const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[process.env.COOKIE_NAME || 'tc_token'];
  if (token) {
    try {
      // Se verifica la firma (aunque haya vencido) para que nadie revoque sesiones ajenas.
      const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
      if (decoded.jti) await sessionModel.revoke(decoded.jti, decoded.sub);
    } catch {
      /* token invalido: solo se limpia la cookie */
    }
  }
  clearTokenCookie(res);
  res.status(200).json({ success: true, message: 'Sesion cerrada correctamente.' });
});

/**
 * GET /api/auth/me
 * Requiere el middleware `protect`. Devuelve el usuario autenticado
 * actual con sus permisos; el frontend usa esto para poblar su AuthContext.
 */
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: { user: withPermissions(req.user) } });
});

module.exports = { login, logout, getMe };
