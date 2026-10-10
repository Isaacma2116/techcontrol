const asyncHandler = require('../utils/asyncHandler');
const model = require('../models/mantenimientoModel');

/**
 * Mantenimientos preventivos y correctivos. Ver: cualquier usuario con sesion.
 * Agendar / editar / cerrar / reprogramar / cancelar: admin y tecnico (lo exigen
 * las rutas con requirePermission).
 */

const ok = (res, data, message) => res.status(200).json({ success: true, message, data });

// GET /api/mantenimientos
const list = asyncHandler(async (req, res) => {
  const data = await model.list({
    desde: req.query.desde,
    hasta: req.query.hasta,
    tipo: req.query.tipo,
    estado: req.query.estado,
    prioridad: req.query.prioridad,
    tipoRecurso: req.query.tipo_recurso,
    recursoId: req.query.recurso_id,
    search: req.query.search,
    page: req.query.page,
    limit: req.query.limit,
  });
  ok(res, data);
});

// GET /api/mantenimientos/stats
const stats = asyncHandler(async (req, res) => {
  ok(res, { stats: await model.stats() });
});

// GET /api/mantenimientos/:id
const getById = asyncHandler(async (req, res) => {
  ok(res, { mantenimiento: await model.findById(req.params.id) });
});

// POST /api/mantenimientos
const create = asyncHandler(async (req, res) => {
  const mantenimiento = await model.create(req.body, req.user.id, req.ip);
  res.status(201).json({
    success: true,
    message: `Mantenimiento ${mantenimiento.folio} agendado para el ${mantenimiento.fecha_programada}.`,
    data: { mantenimiento },
  });
});

// PUT /api/mantenimientos/:id
const update = asyncHandler(async (req, res) => {
  const mantenimiento = await model.update(req.params.id, req.body, req.user.id, req.ip);
  ok(res, { mantenimiento }, 'Mantenimiento actualizado.');
});

// POST /api/mantenimientos/:id/iniciar
const iniciar = asyncHandler(async (req, res) => {
  const mantenimiento = await model.iniciar(req.params.id, req.user.id, req.ip);
  ok(res, { mantenimiento }, 'El mantenimiento quedó en proceso.');
});

// POST /api/mantenimientos/:id/realizar
const realizar = asyncHandler(async (req, res) => {
  const mantenimiento = await model.realizar(req.params.id, req.body, req.user.id, req.ip);
  ok(res, { mantenimiento }, 'Se registró el trabajo realizado.');
});

// POST /api/mantenimientos/:id/reprogramar
const reprogramar = asyncHandler(async (req, res) => {
  const mantenimiento = await model.reprogramar(req.params.id, req.body, req.user.id, req.ip);
  res.status(201).json({
    success: true,
    message: `Reprogramado al ${mantenimiento.fecha_programada} (${mantenimiento.folio}).`,
    data: { mantenimiento },
  });
});

// POST /api/mantenimientos/:id/cancelar
const cancelar = asyncHandler(async (req, res) => {
  const mantenimiento = await model.cancelar(req.params.id, req.body.motivo, req.user.id, req.ip);
  ok(res, { mantenimiento }, 'Mantenimiento cancelado.');
});

// GET /api/mantenimientos/:id/historial
const historial = asyncHandler(async (req, res) => {
  ok(res, { historial: await model.historial(req.params.id) });
});

module.exports = { list, stats, getById, create, update, iniciar, realizar, reprogramar, cancelar, historial };
