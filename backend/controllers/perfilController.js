const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const userModel = require('../models/userModel');
const sessionModel = require('../models/sessionModel');
const { imageUploads } = require('../middleware/uploadMiddleware');
const { withPermissions } = require('../utils/permisos');
const { logAudit } = require('../utils/audit');
const { clearTokenCookie } = require('../utils/generateToken');

/**
 * Perfil y seguridad de la cuenta del usuario AUTENTICADO. Solo trabaja sobre
 * `req.user`: nadie puede editar la cuenta de otro por aqui, y el usuario NO puede
 * cambiar su rol, sus permisos ni su estado (eso lo hace un administrador).
 */

const fieldError = (status, message, field) => {
  const e = new AppError(message, status);
  e.errors = { [field]: message };
  return e;
};

const respondUser = (res, message, user) =>
  res.status(200).json({ success: true, message, data: { user: withPermissions(user) } });

/** Verifica la contrasena actual; si no coincide, error en el campo `password_actual`. */
async function requireCurrentPassword(res, userId, password) {
  const current = await userModel.findByIdWithPassword(userId);
  const ok = current && (await bcrypt.compare(password || '', current.password_hash));
  if (!ok) {
    res.locals.wrongPassword = true; // lo cuenta el limitador de intentos (middleware/rateLimiter)
    throw fieldError(400, 'La contraseña actual no es correcta.', 'password_actual');
  }
  return current;
}

// GET /api/perfil
const getPerfil = asyncHandler(async (req, res) => {
  respondUser(res, undefined, await userModel.findById(req.user.id));
});

// PUT /api/perfil   { nombres, apellidos, telefono, cargo, email, password_actual? }
// Cambiar el correo exige la contrasena actual (es el identificador de acceso).
const updatePerfil = asyncHandler(async (req, res) => {
  const { nombres, apellidos, telefono, cargo } = req.body;
  const email = req.body.email.trim().toLowerCase();
  const before = req.user;

  const emailChanged = email !== before.email.toLowerCase();
  if (emailChanged) {
    await requireCurrentPassword(res, before.id, req.body.password_actual);
    if (await userModel.emailTaken(email, before.id)) {
      throw fieldError(409, 'Ese correo ya está registrado en otra cuenta.', 'email');
    }
  }

  const user = await userModel.updateProfile(before.id, {
    nombres: nombres.trim(),
    apellidos: apellidos?.trim(),
    telefono: telefono?.trim(),
    cargo: cargo?.trim(),
    email,
  });

  const changed = ['nombres', 'apellidos', 'telefono', 'cargo'].filter((k) => (before[k] || null) !== (user[k] || null));
  if (changed.length) {
    await logAudit(null, { userId: before.id, ip: req.ip, action: 'perfil_actualizado', entity: 'usuario', entityId: before.id, details: { campos: changed } });
  }
  if (emailChanged) {
    await logAudit(null, { userId: before.id, ip: req.ip, action: 'correo_cambiado', entity: 'usuario', entityId: before.id, details: { anterior: before.email, nuevo: email } });
  }
  respondUser(res, 'Perfil actualizado correctamente.', user);
});

// PUT /api/perfil/password   { password_actual, password_nueva, password_confirmacion }
// Al cambiarla se cierran las DEMAS sesiones (la actual sigue abierta).
const changePassword = asyncHandler(async (req, res) => {
  const { password_actual, password_nueva } = req.body;
  await requireCurrentPassword(res, req.user.id, password_actual);

  if (password_nueva === password_actual) {
    throw fieldError(400, 'La nueva contraseña debe ser distinta de la actual.', 'password_nueva');
  }

  await userModel.updatePassword(req.user.id, await bcrypt.hash(password_nueva, 12));
  const cerradas = await sessionModel.revokeOthers(req.user.id, req.sessionId);

  await logAudit(null, {
    userId: req.user.id, ip: req.ip, action: 'password_cambiado', entity: 'usuario', entityId: req.user.id,
    details: { sesiones_cerradas: cerradas },
  });
  res.status(200).json({
    success: true,
    message: cerradas
      ? `Contraseña actualizada. Se cerraron ${cerradas} sesión(es) en otros dispositivos.`
      : 'Contraseña actualizada correctamente.',
    data: { sesiones_cerradas: cerradas },
  });
});

// POST /api/perfil/foto   (multipart, campo "foto")
const uploadFoto = asyncHandler(async (req, res) => {
  const { remove } = imageUploads.usuarios;
  const previous = req.user.foto;
  await userModel.setFoto(req.user.id, req.file.filename);
  remove(previous);
  await logAudit(null, { userId: req.user.id, ip: req.ip, action: 'foto_actualizada', entity: 'usuario', entityId: req.user.id });
  respondUser(res, 'Fotografía actualizada.', await userModel.findById(req.user.id));
});

// DELETE /api/perfil/foto
const deleteFoto = asyncHandler(async (req, res) => {
  const previous = req.user.foto;
  await userModel.setFoto(req.user.id, null);
  imageUploads.usuarios.remove(previous);
  respondUser(res, 'Fotografía eliminada.', await userModel.findById(req.user.id));
});

// PUT /api/perfil/preferencias   { tema?, densidad?, acento? }  (personal; nunca afecta a otros usuarios)
const updatePreferencias = asyncHandler(async (req, res) => {
  const { tema, densidad, acento } = req.body;
  const cambios = {};
  if (tema !== undefined) cambios.tema = tema;
  if (densidad !== undefined) cambios.densidad = densidad;
  if (acento !== undefined) cambios.acento = acento;

  const user = await userModel.updatePreferencias(req.user.id, cambios);
  respondUser(res, 'Preferencias guardadas.', user);
});

// POST /api/perfil/verificar-password   { password }
// Paso adicional antes de ver datos sensibles (Wi-Fi, importar/exportar...), solo
// cuando la empresa activo esa politica. Confirma la sesion ACTUAL por N minutos.
const verificarPassword = asyncHandler(async (req, res) => {
  await requireCurrentPassword(res, req.user.id, req.body.password);
  await sessionModel.marcarReautenticado(req.sessionId);
  await logAudit(null, { userId: req.user.id, ip: req.ip, action: 'reautenticado', entity: 'usuario', entityId: req.user.id });
  res.status(200).json({ success: true, message: 'Identidad confirmada.' });
});

// GET /api/perfil/sesiones
const getSesiones = asyncHandler(async (req, res) => {
  const sesiones = (await sessionModel.listActive(req.user.id)).map((s) => ({ ...s, actual: s.id === req.sessionId }));
  res.status(200).json({ success: true, data: { sesiones } });
});

// DELETE /api/perfil/sesiones/otras
const closeOtherSessions = asyncHandler(async (req, res) => {
  const cerradas = await sessionModel.revokeOthers(req.user.id, req.sessionId);
  if (cerradas) {
    await logAudit(null, { userId: req.user.id, ip: req.ip, action: 'sesiones_cerradas', entity: 'usuario', entityId: req.user.id, details: { cantidad: cerradas } });
  }
  res.status(200).json({
    success: true,
    message: cerradas ? `Se cerraron ${cerradas} sesión(es).` : 'No había otras sesiones abiertas.',
    data: { cerradas },
  });
});

// DELETE /api/perfil/sesiones/:id   (otra sesion; para la actual se usa "Cerrar sesion")
const closeSession = asyncHandler(async (req, res) => {
  if (req.params.id === req.sessionId) {
    throw new AppError('Esta es tu sesión actual. Usa "Cerrar sesión" para salir.', 400);
  }
  const cerradas = await sessionModel.revoke(req.params.id, req.user.id);
  if (!cerradas) throw new AppError('Sesión no encontrada.', 404);
  await logAudit(null, { userId: req.user.id, ip: req.ip, action: 'sesiones_cerradas', entity: 'usuario', entityId: req.user.id, details: { cantidad: 1 } });
  res.status(200).json({ success: true, message: 'Sesión cerrada.' });
});

// DELETE /api/perfil   { password, confirmacion }
// Zona peligrosa: desactiva el acceso y borra los datos de contacto (correo, telefono,
// foto); el historial de auditoria y las referencias en asignaciones/cartas se conservan.
// No se permite si es el ultimo administrador activo (dejaria el sistema sin ninguno).
const eliminarCuenta = asyncHandler(async (req, res) => {
  await requireCurrentPassword(res, req.user.id, req.body.password);

  if (req.user.role === 'admin') {
    const totalAdmins = await userModel.countActiveAdmins();
    if (totalAdmins <= 1) {
      throw new AppError('No puedes eliminar tu cuenta: eres el último administrador activo.', 400);
    }
  }

  const fotoAnterior = req.user.foto;
  await userModel.anonymizarYDesactivar(req.user.id);
  await sessionModel.revokeAll(req.user.id);
  imageUploads.usuarios.remove(fotoAnterior);

  await logAudit(null, { userId: req.user.id, ip: req.ip, action: 'cuenta_eliminada', entity: 'usuario', entityId: req.user.id });

  clearTokenCookie(res);
  res.status(200).json({ success: true, message: 'Tu cuenta se eliminó correctamente.' });
});

module.exports = {
  getPerfil, updatePerfil, changePassword, updatePreferencias, verificarPassword,
  uploadFoto, deleteFoto, getSesiones, closeOtherSessions, closeSession,
  eliminarCuenta,
};
