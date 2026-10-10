const asyncHandler = require('../utils/asyncHandler');
const model = require('../models/dispositivoRedModel');
const { imageUploads } = require('../middleware/uploadMiddleware');

const ok = (res, data, message) => res.status(200).json({ success: true, message, data });

const list = asyncHandler(async (req, res) => {
  ok(res, await model.list({
    search: req.query.search, tipo: req.query.tipo, estado: req.query.estado,
    ubicacionId: req.query.ubicacion_id, redId: req.query.red_id, page: req.query.page, limit: req.query.limit,
  }));
});

const stats = asyncHandler(async (req, res) => {
  ok(res, { stats: await model.stats() });
});

const conexiones = asyncHandler(async (req, res) => {
  ok(res, { conexiones: await model.conexiones() });
});

const getById = asyncHandler(async (req, res) => {
  ok(res, { dispositivo: await model.findById(req.params.id) });
});

const create = asyncHandler(async (req, res) => {
  const dispositivo = await model.create(req.body, req.user.id, req.ip);
  res.status(201).json({ success: true, message: `${dispositivo.codigo} registrado correctamente.`, data: { dispositivo } });
});

const update = asyncHandler(async (req, res) => {
  const dispositivo = await model.update(req.params.id, req.body, req.user.id, req.ip);
  ok(res, { dispositivo }, 'Dispositivo actualizado correctamente.');
});

const setEstado = asyncHandler(async (req, res) => {
  const dispositivo = await model.setEstado(req.params.id, req.body.estado, req.user.id, req.ip);
  ok(res, { dispositivo }, 'Estado actualizado.');
});

const uploadImagen = asyncHandler(async (req, res) => {
  const { remove } = imageUploads['dispositivos-red'];
  const actual = await model.findById(req.params.id);
  await model.setImagen(req.params.id, req.file.filename, req.user.id);
  remove(actual.imagen);
  ok(res, { dispositivo: await model.findById(req.params.id) }, 'Imagen actualizada.');
});

const deleteImagen = asyncHandler(async (req, res) => {
  const actual = await model.findById(req.params.id);
  await model.setImagen(req.params.id, null, req.user.id);
  imageUploads['dispositivos-red'].remove(actual.imagen);
  ok(res, { dispositivo: await model.findById(req.params.id) }, 'Imagen eliminada.');
});

const redesAsociadas = asyncHandler(async (req, res) => {
  ok(res, { redes: await model.redesDelDispositivo(req.params.id) });
});

const historial = asyncHandler(async (req, res) => {
  ok(res, { historial: await model.historial(req.params.id) });
});

const asociarRed = asyncHandler(async (req, res) => {
  const redes = await model.asociarRed(req.params.id, req.body.red_id, req.user.id, req.ip);
  res.status(201).json({ success: true, message: 'Red asociada correctamente.', data: { redes } });
});

const desasociarRed = asyncHandler(async (req, res) => {
  const redes = await model.desasociarRed(req.params.id, req.params.redId, req.user.id, req.ip);
  ok(res, { redes }, 'Red desasociada correctamente.');
});

module.exports = {
  list, stats, conexiones, getById, create, update, setEstado, uploadImagen, deleteImagen,
  redesAsociadas, asociarRed, desasociarRed, historial,
};
