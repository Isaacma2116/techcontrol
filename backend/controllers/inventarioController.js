const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { KINDS } = require('../utils/inventario');
const { equipoModel, accesorioModel, impresoraModel, celularModel } = require('../models/inventarioModel');
const { imageUploads } = require('../middleware/uploadMiddleware');

const MODELS = {
  equipos: equipoModel,
  accesorios: accesorioModel,
  impresoras: impresoraModel,
  celulares: celularModel,
};

// Campos de texto/fecha/numero de cualquier tipo de inventario: un string vacio se guarda como NULL.
const OPTIONAL_TEXT = new Set([
  ...Object.values(KINDS).flatMap((cfg) => cfg.editable),
  'observaciones_asignacion', 'fecha_asignacion',
]);

const isTrue = (v) => v === true || v === 1 || v === '1' || v === 'true';

/**
 * Strings vacios -> NULL; MAC normalizada (AA:BB:CC:DD:EE:FF); IMEI solo digitos;
 * booleanos del tipo; colaborador_id numerico o null.
 */
function normalizeBody(body, cfg) {
  const data = { ...body };

  for (const key of OPTIONAL_TEXT) {
    if (typeof data[key] === 'string') data[key] = data[key].trim() || null;
  }
  for (const key of cfg.boolFields) data[key] = isTrue(data[key]);
  for (const key of ['imei_1', 'imei_2']) {
    if (data[key]) data[key] = String(data[key]).replace(/[\s-]/g, '');
  }
  if (data.correo_asociado) data.correo_asociado = data.correo_asociado.toLowerCase();
  if (typeof data.codigo_inventario === 'string') {
    data.codigo_inventario = data.codigo_inventario.trim().toUpperCase() || undefined;
  }
  if (data.mac_address) {
    data.mac_address = data.mac_address.replace(/[^0-9a-f]/gi, '').toUpperCase().match(/.{2}/g).join(':');
  }
  if (Array.isArray(data.componentes_adicionales)) {
    const list = data.componentes_adicionales.map((c) => String(c).trim()).filter(Boolean);
    data.componentes_adicionales = list.length ? list : null;
  }
  // undefined = "no tocar el responsable"; '' / null = "sin asignar"; numero = asignar a ese colaborador.
  if ('colaborador_id' in data) {
    data.colaborador_id = data.colaborador_id === '' || data.colaborador_id === null ? null : Number(data.colaborador_id);
  }
  return data;
}

function makeInventarioController(kind) {
  const cfg = KINDS[kind];
  const model = MODELS[kind];
  const images = imageUploads[kind];

  /** Traduce violaciones de UNIQUE / FK de MySQL a errores por campo. */
  function handleDbError(err) {
    const fieldError = (status, message, field) => {
      const e = new AppError(message, status);
      e.errors = { [field]: message };
      return e;
    };
    if (err.code === 'ER_DUP_ENTRY') {
      for (const [key, [field, message]] of Object.entries(cfg.uniqueFields)) {
        if (err.sqlMessage?.includes(key)) return fieldError(409, message, field);
      }
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      for (const [key, [field, message]] of Object.entries(cfg.fkFields)) {
        if (err.sqlMessage?.includes(key)) return fieldError(400, message, field);
      }
    }
    return err;
  }

  async function findOrFail(id) {
    const item = await model.findById(id);
    if (!item) throw new AppError(`${cfg.Label} no encontrad${cfg.o}.`, 404);
    return item;
  }

  // GET /api/{kind}?search=&tipo=&estado=a,b&colaborador_id=&asignacion=con|sin&marca=&ubicacion_id=&page=&limit=
  const list = asyncHandler(async (req, res) => {
    const { search, tipo, estado, colaborador_id, asignacion, marca, ubicacion_id } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;

    const { rows, total } = await model.findAll(
      {
        search: search?.trim(),
        tipo: tipo || undefined,
        estados: estado ? estado.split(',') : undefined,
        colaboradorId: colaborador_id ? Number(colaborador_id) : undefined,
        asignacion,
        marca: marca || undefined,
        ubicacionId: ubicacion_id ? Number(ubicacion_id) : undefined,
      },
      { page, limit }
    );

    res.status(200).json({
      success: true,
      data: {
        items: rows,
        pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      },
    });
  });

  const stats = asyncHandler(async (req, res) => {
    res.status(200).json({ success: true, data: { stats: await model.getStats() } });
  });

  const marcas = asyncHandler(async (req, res) => {
    res.status(200).json({ success: true, data: { marcas: await model.findMarcas() } });
  });

  const getById = asyncHandler(async (req, res) => {
    res.status(200).json({ success: true, data: { item: await findOrFail(req.params.id) } });
  });

  const getHistorial = asyncHandler(async (req, res) => {
    await findOrFail(req.params.id);
    res.status(200).json({ success: true, data: { historial: await model.findHistorial(req.params.id) } });
  });

  const create = asyncHandler(async (req, res) => {
    let item;
    try {
      item = await model.create(normalizeBody(req.body, cfg), { userId: req.user.id, ip: req.ip });
    } catch (err) {
      throw handleDbError(err);
    }
    res.status(201).json({ success: true, message: `${cfg.Label} cread${cfg.o} correctamente.`, data: { item } });
  });

  const update = asyncHandler(async (req, res) => {
    await findOrFail(req.params.id);
    let item;
    try {
      item = await model.update(Number(req.params.id), normalizeBody(req.body, cfg), { userId: req.user.id, ip: req.ip });
    } catch (err) {
      throw handleDbError(err);
    }
    res.status(200).json({ success: true, message: `${cfg.Label} actualizad${cfg.o} correctamente.`, data: { item } });
  });

  // PATCH /api/{kind}/:id/estado
  const setEstado = asyncHandler(async (req, res) => {
    await findOrFail(req.params.id);
    const item = await model.setEstado(Number(req.params.id), req.body.estado, req.body.observaciones?.trim(), { userId: req.user.id, ip: req.ip });
    res.status(200).json({ success: true, message: 'Estado actualizado correctamente.', data: { item } });
  });

  // POST /api/{kind}/:id/imagen  (multipart, campo "imagen")
  const uploadImagen = asyncHandler(async (req, res) => {
    let existing;
    try {
      existing = await findOrFail(req.params.id);
    } catch (err) {
      images.remove(req.file?.filename); // no dejar archivos huerfanos
      throw err;
    }
    await model.setImagen(existing.id, req.file.filename);
    images.remove(existing.imagen);
    res.status(200).json({ success: true, message: 'Imagen actualizada.', data: { item: await model.findById(existing.id) } });
  });

  const deleteImagen = asyncHandler(async (req, res) => {
    const existing = await findOrFail(req.params.id);
    await model.setImagen(existing.id, null);
    images.remove(existing.imagen);
    res.status(200).json({ success: true, message: 'Imagen eliminada.', data: { item: await model.findById(existing.id) } });
  });

  // POST /api/{kind}/:id/password  (solo kinds con cfg.withPassword, p. ej. equipos)
  const revelarPassword = cfg.withPassword
    ? asyncHandler(async (req, res) => {
        const password = await model.revelarPassword(req.params.id, req.user.id, req.ip);
        res.status(200).json({ success: true, data: { password } });
      })
    : undefined;

  return { list, stats, marcas, getById, getHistorial, create, update, setEstado, uploadImagen, deleteImagen, revelarPassword };
}

module.exports = { makeInventarioController, MODELS };
