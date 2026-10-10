const asyncHandler = require('../utils/asyncHandler');
const model = require('../models/softwareModel');
const licenciaModel = require('../models/licenciaModel');

const ok = (res, data, message) => res.status(200).json({ success: true, message, data });

const list = asyncHandler(async (req, res) => {
  ok(res, await model.list({
    search: req.query.search, tipo: req.query.tipo, categoriaId: req.query.categoria_id,
    fabricanteId: req.query.fabricante_id, requiereLicencia: req.query.requiere_licencia,
    estado: req.query.estado, page: req.query.page, limit: req.query.limit,
  }));
});

const stats = asyncHandler(async (req, res) => {
  ok(res, { stats: await model.stats() });
});

const getById = asyncHandler(async (req, res) => {
  ok(res, { software: await model.findById(req.params.id) });
});

const create = asyncHandler(async (req, res) => {
  const software = await model.create(req.body, req.user.id, req.ip);
  res.status(201).json({ success: true, message: `${software.nombre} registrado correctamente.`, data: { software } });
});

const update = asyncHandler(async (req, res) => {
  const software = await model.update(req.params.id, req.body, req.user.id, req.ip);
  ok(res, { software }, 'Software actualizado correctamente.');
});

const setEstado = asyncHandler(async (req, res) => {
  const software = await model.setEstado(req.params.id, req.body.estado, req.user.id, req.ip);
  ok(res, { software }, 'Estado actualizado.');
});

// GET /api/software/:id/licencias
const licencias = asyncHandler(async (req, res) => {
  const data = await licenciaModel.list({ softwareId: req.params.id, limit: 100 });
  ok(res, { licencias: data.licencias });
});

// GET /api/software/:id/usuarios
const usuarios = asyncHandler(async (req, res) => {
  ok(res, { usuarios: await licenciaModel.usuariosDeSoftware(req.params.id) });
});

module.exports = { list, stats, getById, create, update, setEstado, licencias, usuarios };
