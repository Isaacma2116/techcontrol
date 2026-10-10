const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const userModel = require('../models/userModel');
const sessionModel = require('../models/sessionModel');
const { logAudit } = require('../utils/audit');
const { permissionsFor, PERMISOS } = require('../utils/permisos');

/** Genera una contrasena temporal aleatoria que cumple la politica (utils/password.js). */
function generarPasswordTemporal() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const all = upper + lower + digits;
  const pick = (set) => set[crypto.randomInt(set.length)];
  const chars = [pick(upper), pick(lower), pick(digits)];
  for (let i = 0; i < 9; i++) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

/**
 * Evita dejar el sistema sin ningun administrador activo: se llama antes de
 * desactivar un usuario o de cambiarle el rol.
 */
async function verificarNoUltimoAdmin(existing, { role, active }) {
  const dejaDeSerAdminActivo =
    existing.role === 'admin' && existing.active &&
    ((role !== undefined && role !== 'admin') || (active !== undefined && !active));
  if (!dejaDeSerAdminActivo) return;

  const totalAdmins = await userModel.countActiveAdmins();
  if (totalAdmins <= 1) {
    throw new AppError('No puedes dejar el sistema sin administradores activos.', 400);
  }
}

// GET /api/users  (admin, technician)
const getUsers = asyncHandler(async (req, res) => {
  const users = await userModel.findAll();
  res.status(200).json({ success: true, data: { users } });
});

// GET /api/users/:id  (admin, technician, o el propio usuario)
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (req.user.role === 'viewer' && String(req.user.id) !== String(id)) {
    throw new AppError('No tienes permisos para ver este usuario.', 403);
  }

  const user = await userModel.findById(id);
  if (!user) throw new AppError('Usuario no encontrado.', 404);

  res.status(200).json({ success: true, data: { user } });
});

// POST /api/users  (admin)
const createUser = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { name, username, email, password, role } = req.body;

  const existing = await userModel.findByEmailOrUsername(email, username);
  if (existing) {
    throw new AppError('Ya existe un usuario con ese correo o nombre de usuario.', 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await userModel.create({ name, username, email, passwordHash, role });

  await logAudit(null, { userId: req.user.id, action: 'creado', entity: 'usuario', entityId: user.id, details: { username, role: user.role }, ip: req.ip });

  res.status(201).json({ success: true, data: { user } });
});

// PUT /api/users/:id  (admin)
const updateUser = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { id } = req.params;
  const { name, username, email, role, active } = req.body;

  const existing = await userModel.findById(id);
  if (!existing) throw new AppError('Usuario no encontrado.', 404);

  const esUnoMismo = String(req.user.id) === String(id);
  if (esUnoMismo && role !== undefined && role !== existing.role) {
    throw new AppError('No puedes cambiar tu propio rol.', 400);
  }
  if (esUnoMismo && active !== undefined && !active) {
    throw new AppError('No puedes desactivar tu propia cuenta.', 400);
  }
  if (
    (username !== undefined || email !== undefined) &&
    (await userModel.identifierTakenByOther(email ?? existing.email, username ?? existing.username, id))
  ) {
    throw new AppError('Ya existe un usuario con ese correo o nombre de usuario.', 409);
  }
  await verificarNoUltimoAdmin(existing, { role, active });

  const updated = await userModel.updateById(id, { name, username, email, role, active });
  if (active === false) await sessionModel.revokeAll(id);
  await logAudit(null, {
    userId: req.user.id,
    action: 'editado',
    entity: 'usuario',
    entityId: id,
    details: { role: role ?? undefined, active: active ?? undefined },
    ip: req.ip,
  });

  res.status(200).json({ success: true, data: { user: updated } });
});

// PATCH /api/users/:id/estado  { active }  (admin) — activar/desactivar (nunca se borra fisicamente)
const cambiarEstadoUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const active = !!req.body.active;

  if (String(req.user.id) === String(id)) {
    throw new AppError('No puedes desactivar tu propia cuenta.', 400);
  }

  const existing = await userModel.findById(id);
  if (!existing) throw new AppError('Usuario no encontrado.', 404);

  await verificarNoUltimoAdmin(existing, { active });

  const updated = await userModel.setActivo(id, active);
  if (!active) await sessionModel.revokeAll(id); // no puede seguir usando sesiones ya abiertas
  await logAudit(null, { userId: req.user.id, action: active ? 'activado' : 'desactivado', entity: 'usuario', entityId: id, ip: req.ip });

  res.status(200).json({ success: true, data: { user: updated } });
});

// POST /api/users/:id/restablecer-password  (admin) — genera una contrasena temporal
const restablecerPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await userModel.findById(id);
  if (!existing) throw new AppError('Usuario no encontrado.', 404);

  const passwordTemporal = generarPasswordTemporal();
  const passwordHash = await bcrypt.hash(passwordTemporal, 12);
  await userModel.resetPassword(id, passwordHash);
  const cerradas = await sessionModel.revokeAll(id); // fuerza a iniciar sesion de nuevo con la temporal

  // La contrasena solo se devuelve en esta respuesta: nunca se guarda en texto plano ni en la auditoria.
  await logAudit(null, { userId: req.user.id, action: 'restablecio_password', entity: 'usuario', entityId: id, details: { sesiones_cerradas: cerradas }, ip: req.ip });

  res.status(200).json({ success: true, data: { passwordTemporal } });
});

// GET /api/users/permisos  (admin) — matriz de permisos por rol, para mostrarla de solo lectura
const getPermisos = asyncHandler(async (req, res) => {
  const roles = ['admin', 'technician', 'viewer'];
  const matriz = Object.keys(PERMISOS).map((permiso) => ({
    permiso,
    roles: Object.fromEntries(roles.map((r) => [r, PERMISOS[permiso].includes(r)])),
  }));
  res.status(200).json({ success: true, data: { matriz, porRol: Object.fromEntries(roles.map((r) => [r, permissionsFor(r)])) } });
});

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  cambiarEstadoUser,
  restablecerPassword,
  getPermisos,
};
