const asyncHandler = require('../utils/asyncHandler');
const model = require('../models/licenciaModel');
const { can } = require('../utils/permisos');

const ok = (res, data, message) => res.status(200).json({ success: true, message, data });

// Costo, moneda, contrato y factura solo se devuelven a quien tiene 'licencias.costos_ver'
// (por defecto, admin). El resto de la licencia (puestos, fechas, estado) se ve igual.
const CAMPOS_COSTO = ['costo', 'moneda', 'numero_contrato', 'numero_factura'];
function ocultarCostos(licencia) {
  const limpio = { ...licencia };
  for (const campo of CAMPOS_COSTO) delete limpio[campo];
  return limpio;
}
const segunPermiso = (req, licencia) => (can(req.user.role, 'licencias.costos_ver') ? licencia : ocultarCostos(licencia));

// Quien no puede VER el costo tampoco puede escribirlo (si el campo llega igual,
// p. ej. por una llamada directa a la API, se ignora y se conserva el valor anterior).
function limpiarCostosEntrada(req) {
  if (can(req.user.role, 'licencias.costos_ver')) return;
  for (const campo of CAMPOS_COSTO) delete req.body[campo];
}

const list = asyncHandler(async (req, res) => {
  const data = await model.list({
    search: req.query.search, softwareId: req.query.software_id, modeloId: req.query.modelo_id,
    proveedorId: req.query.proveedor_id, estado: req.query.estado, venceEnDias: req.query.vence_en_dias,
    page: req.query.page, limit: req.query.limit,
  });
  ok(res, { ...data, licencias: data.licencias.map((l) => segunPermiso(req, l)) });
});

const stats = asyncHandler(async (req, res) => {
  ok(res, { stats: await model.stats() });
});

const getById = asyncHandler(async (req, res) => {
  ok(res, { licencia: segunPermiso(req, await model.findById(req.params.id)) });
});

const create = asyncHandler(async (req, res) => {
  limpiarCostosEntrada(req);
  const licencia = await model.create(req.body, req.user.id, req.ip);
  res.status(201).json({ success: true, message: `Licencia ${licencia.codigo} creada correctamente.`, data: { licencia: segunPermiso(req, licencia) } });
});

const update = asyncHandler(async (req, res) => {
  limpiarCostosEntrada(req);
  const licencia = await model.update(req.params.id, req.body, req.user.id, req.ip);
  ok(res, { licencia: segunPermiso(req, licencia) }, 'Licencia actualizada correctamente.');
});

const setEstado = asyncHandler(async (req, res) => {
  const licencia = await model.setEstado(req.params.id, req.body.estado, req.user.id, req.ip);
  ok(res, { licencia: segunPermiso(req, licencia) }, 'Estado actualizado.');
});

const renovar = asyncHandler(async (req, res) => {
  limpiarCostosEntrada(req);
  const licencia = await model.renovar(req.params.id, req.body, req.user.id, req.ip);
  res.status(201).json({ success: true, message: `Renovada como ${licencia.codigo}.`, data: { licencia: segunPermiso(req, licencia) } });
});

const asignaciones = asyncHandler(async (req, res) => {
  ok(res, { asignaciones: await model.asignaciones(req.params.id) });
});

const asignar = asyncHandler(async (req, res) => {
  const asignacion = await model.asignar(req.params.id, req.body, req.user.id, req.ip);
  res.status(201).json({ success: true, message: 'Puesto asignado correctamente.', data: { asignacion } });
});

const liberar = asyncHandler(async (req, res) => {
  const asignacion = await model.liberar(req.params.id, req.params.asignacionId, req.body, req.user.id, req.ip);
  ok(res, { asignacion }, 'Puesto liberado correctamente.');
});

const transferir = asyncHandler(async (req, res) => {
  const asignacion = await model.transferir(req.params.id, req.params.asignacionId, req.body, req.user.id, req.ip);
  res.status(201).json({ success: true, message: 'Licencia transferida correctamente.', data: { asignacion } });
});

const historial = asyncHandler(async (req, res) => {
  ok(res, { historial: await model.historial(req.params.id) });
});

module.exports = { list, stats, getById, create, update, setEstado, renovar, asignaciones, asignar, liberar, transferir, historial };
