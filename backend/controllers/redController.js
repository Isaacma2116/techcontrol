const asyncHandler = require('../utils/asyncHandler');
const model = require('../models/redModel');

const ok = (res, data, message) => res.status(200).json({ success: true, message, data });

const list = asyncHandler(async (req, res) => {
  ok(res, await model.list({
    search: req.query.search, tipo: req.query.tipo, estado: req.query.estado,
    ubicacionId: req.query.ubicacion_id, areaId: req.query.area_id, page: req.query.page, limit: req.query.limit,
  }));
});

// GET /api/redes/todas — sin paginar, solo activas (para el selector de "asociar red")
const listAll = asyncHandler(async (req, res) => {
  ok(res, { redes: await model.listAll() });
});

const stats = asyncHandler(async (req, res) => {
  ok(res, { stats: await model.stats() });
});

const getById = asyncHandler(async (req, res) => {
  ok(res, { red: await model.findById(req.params.id) });
});

const create = asyncHandler(async (req, res) => {
  const red = await model.create(req.body, req.user.id, req.ip);
  res.status(201).json({ success: true, message: `Red "${red.nombre}" creada correctamente.`, data: { red } });
});

const update = asyncHandler(async (req, res) => {
  const red = await model.update(req.params.id, req.body, req.user.id, req.ip);
  ok(res, { red }, 'Red actualizada correctamente.');
});

const setEstado = asyncHandler(async (req, res) => {
  const red = await model.setEstado(req.params.id, req.body.estado, req.user.id, req.ip);
  ok(res, { red }, red.estado === 'activa' ? 'Red reactivada.' : 'Red desactivada.');
});

const revelarPassword = asyncHandler(async (req, res) => {
  const password = await model.revelarPassword(req.params.id, req.user.id, req.ip);
  ok(res, { password });
});

const dispositivos = asyncHandler(async (req, res) => {
  ok(res, { dispositivos: await model.dispositivosDeRed(req.params.id) });
});

const historial = asyncHandler(async (req, res) => {
  ok(res, { historial: await model.historial(req.params.id) });
});

module.exports = { list, listAll, stats, getById, create, update, setEstado, revelarPassword, dispositivos, historial };
