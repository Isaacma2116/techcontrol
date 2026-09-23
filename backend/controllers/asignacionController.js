const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { KINDS } = require('../utils/inventario');
const asignacionModel = require('../models/asignacionModel');
const { MODELS } = require('./inventarioController');

/**
 * Asignar / devolver equipos, accesorios, impresoras y celulares. La logica transaccional y las
 * validaciones de negocio viven en models/asignacionModel.js.
 */
function makeAsignacionController(kind) {
  const cfg = KINDS[kind];
  const model = MODELS[kind];

  // POST /api/asignaciones/{kind}   { equipo_id|accesorio_id|impresora_id|celular_id, colaborador_id, fecha_asignacion?, observaciones? }
  const assign = asyncHandler(async (req, res) => {
    const itemId = Number(req.body[cfg.asigFk]);
    await asignacionModel.assign(kind, {
      itemId,
      colaboradorId: Number(req.body.colaborador_id),
      fecha: req.body.fecha_asignacion || undefined,
      observaciones: req.body.observaciones?.trim(),
      userId: req.user.id,
      ip: req.ip,
    });

    res.status(201).json({
      success: true,
      message: `${cfg.Label} asignad${cfg.o} correctamente.`,
      data: { item: await model.findById(itemId) },
    });
  });

  // POST /api/asignaciones/{kind}/:id/devolver   { condicion, fecha_devolucion?, observaciones?, nuevo_estado? }
  const devolver = asyncHandler(async (req, res) => {
    const { itemId } = await asignacionModel.devolver(kind, Number(req.params.id), {
      fecha: req.body.fecha_devolucion || undefined,
      condicion: req.body.condicion,
      observaciones: req.body.observaciones?.trim(),
      nuevoEstado: req.body.nuevo_estado || undefined,
      userId: req.user.id,
      ip: req.ip,
    });

    const item = await model.findById(itemId);
    if (!item) throw new AppError(`${cfg.Label} no encontrad${cfg.o}.`, 404);
    res.status(200).json({ success: true, message: `${cfg.Label} devuelt${cfg.o} correctamente.`, data: { item } });
  });

  return { assign, devolver };
}

module.exports = { makeAsignacionController };
