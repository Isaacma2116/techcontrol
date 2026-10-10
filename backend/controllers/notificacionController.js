const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const notificacionModel = require('../models/notificacionModel');

// GET /api/notificaciones?leida=&page=&limit=
const list = asyncHandler(async (req, res) => {
  await notificacionModel.sincronizarAlertasConThrottle();

  const { leida } = req.query;
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 50);

  const { rows, total } = await notificacionModel.findAll(req.user.id, {
    leida: leida === undefined || leida === '' ? undefined : leida === 'true' || leida === '1',
    page,
    limit,
  });

  res.status(200).json({
    success: true,
    data: { notificaciones: rows, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } },
  });
});

// GET /api/notificaciones/no-leidas
const noLeidas = asyncHandler(async (req, res) => {
  await notificacionModel.sincronizarAlertasConThrottle();
  const total = await notificacionModel.countNoLeidas(req.user.id);
  res.status(200).json({ success: true, data: { total } });
});

// PATCH /api/notificaciones/:id/leida
const marcarLeida = asyncHandler(async (req, res) => {
  const afectadas = await notificacionModel.marcarLeida(Number(req.params.id), req.user.id);
  if (!afectadas) throw new AppError('Notificación no encontrada.', 404);
  res.status(200).json({ success: true, message: 'Notificación marcada como leída.' });
});

// POST /api/notificaciones/marcar-todas
const marcarTodasLeidas = asyncHandler(async (req, res) => {
  const cantidad = await notificacionModel.marcarTodasLeidas(req.user.id);
  res.status(200).json({ success: true, message: cantidad ? `${cantidad} notificación(es) marcada(s) como leída(s).` : 'No había notificaciones pendientes.', data: { cantidad } });
});

// GET /api/notificaciones/preferencias
const getPreferencias = asyncHandler(async (req, res) => {
  const preferencias = await notificacionModel.getPreferencias(req.user.id, req.user.role);
  res.status(200).json({ success: true, data: { preferencias } });
});

// PUT /api/notificaciones/preferencias   { preferencias: [{ categoria, canal_sistema, canal_correo }] }
const guardarPreferencias = asyncHandler(async (req, res) => {
  if (!Array.isArray(req.body.preferencias)) throw new AppError('Formato de preferencias inválido.', 400);
  const preferencias = await notificacionModel.guardarPreferencias(req.user.id, req.user.role, req.body.preferencias);
  res.status(200).json({ success: true, message: 'Preferencias de notificaciones guardadas.', data: { preferencias } });
});

module.exports = { list, noLeidas, marcarLeida, marcarTodasLeidas, getPreferencias, guardarPreferencias };
