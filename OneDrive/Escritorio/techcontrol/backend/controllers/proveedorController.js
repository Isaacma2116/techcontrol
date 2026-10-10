const asyncHandler = require('../utils/asyncHandler');
const model = require('../models/proveedorModel');
const { logAudit } = require('../utils/audit');

const ok = (res, data, message) => res.status(200).json({ success: true, message, data });

const list = asyncHandler(async (req, res) => {
  ok(res, await model.list({ search: req.query.search, activo: req.query.activo, page: req.query.page, limit: req.query.limit }));
});

const getById = asyncHandler(async (req, res) => {
  ok(res, { proveedor: await model.findById(req.params.id) });
});

const create = asyncHandler(async (req, res) => {
  const proveedor = await model.create(req.body);
  await logAudit(null, { userId: req.user.id, ip: req.ip, action: 'creado', entity: 'proveedor', entityId: proveedor.id, details: { nombre: proveedor.nombre } });
  res.status(201).json({ success: true, message: 'Proveedor creado correctamente.', data: { proveedor } });
});

const update = asyncHandler(async (req, res) => {
  const proveedor = await model.update(req.params.id, req.body);
  await logAudit(null, { userId: req.user.id, ip: req.ip, action: 'editado', entity: 'proveedor', entityId: proveedor.id });
  ok(res, { proveedor }, 'Proveedor actualizado correctamente.');
});

const setActivo = asyncHandler(async (req, res) => {
  const proveedor = await model.setActivo(req.params.id, req.body.activo);
  await logAudit(null, { userId: req.user.id, ip: req.ip, action: proveedor.activo ? 'activado' : 'desactivado', entity: 'proveedor', entityId: proveedor.id });
  ok(res, { proveedor }, proveedor.activo ? 'Proveedor activado.' : 'Proveedor desactivado.');
});

module.exports = { list, getById, create, update, setActivo };
