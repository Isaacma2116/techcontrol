const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const colaboradorModel = require('../models/colaboradorModel');
const { removeFoto } = require('../middleware/uploadMiddleware');
const { logAudit } = require('../utils/audit');
const { libroDeUnaHoja, leerHojaComoObjetos } = require('../utils/importExport');

const ENTITY = 'colaborador';

const OPTIONAL_TEXT_FIELDS = [
  'apellido_materno', 'correo_empresarial', 'telefono_empresarial',
  'correo_personal', 'telefono_personal',
];

/** Deja el body listo para guardar: strings vacios -> NULL y baja coherente con el estado. */
function normalizeBody(body) {
  const data = { ...body };
  for (const key of OPTIONAL_TEXT_FIELDS) {
    if (typeof data[key] === 'string') data[key] = data[key].trim() || null;
  }
  if (data.correo_empresarial) data.correo_empresarial = data.correo_empresarial.toLowerCase();
  if (data.correo_personal) data.correo_personal = data.correo_personal.toLowerCase();
  // Un colaborador activo no tiene fecha de baja; al reactivarlo se limpia.
  data.fecha_baja = data.activo ? null : data.fecha_baja || null;
  return data;
}

/** Traduce violaciones de UNIQUE / FK de MySQL a errores 409/400 por campo. */
function handleDbError(err) {
  const fieldError = (status, message, field) => {
    const e = new AppError(message, status);
    e.errors = { [field]: message };
    return e;
  };

  if (err.code === 'ER_DUP_ENTRY') {
    if (err.sqlMessage?.includes('uq_colaboradores_id_empleado')) {
      return fieldError(409, 'Ya existe un colaborador con ese ID de empleado.', 'id_empleado');
    }
    if (err.sqlMessage?.includes('uq_colaboradores_correo_empresarial')) {
      return fieldError(409, 'Ya existe un colaborador con ese correo empresarial.', 'correo_empresarial');
    }
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    if (err.sqlMessage?.includes('fk_colaboradores_area')) {
      return fieldError(400, 'El área seleccionada no existe.', 'area_id');
    }
    if (err.sqlMessage?.includes('fk_colaboradores_cargo')) {
      return fieldError(400, 'El cargo seleccionado no existe.', 'cargo_id');
    }
  }
  return err;
}

async function findOrFail(id) {
  const colaborador = await colaboradorModel.findById(id);
  if (!colaborador) throw new AppError('Colaborador no encontrado.', 404);
  return colaborador;
}

// GET /api/colaboradores?search=&area_id=&cargo_id=&activo=&asignacion=con|sin&page=&limit=
const list = asyncHandler(async (req, res) => {
  const { search, area_id, cargo_id, activo, asignacion } = req.query;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;

  const { rows, total } = await colaboradorModel.findAll(
    {
      search: search?.trim(),
      areaId: area_id ? Number(area_id) : undefined,
      cargoId: cargo_id ? Number(cargo_id) : undefined,
      activo: activo === undefined || activo === '' ? undefined : activo === 'true' || activo === '1',
      asignacion,
    },
    { page, limit }
  );

  res.status(200).json({
    success: true,
    data: {
      colaboradores: rows,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    },
  });
});

// GET /api/colaboradores/stats
const stats = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: { stats: await colaboradorModel.getStats() } });
});

// GET /api/colaboradores/:id
const getById = asyncHandler(async (req, res) => {
  const colaborador = await findOrFail(req.params.id);
  res.status(200).json({ success: true, data: { colaborador } });
});

// GET /api/colaboradores/:id/equipos
const getEquipos = asyncHandler(async (req, res) => {
  await findOrFail(req.params.id);
  const equipos = await colaboradorModel.findEquiposAsignados(req.params.id);
  res.status(200).json({ success: true, data: { equipos } });
});

// GET /api/colaboradores/:id/accesorios
const getAccesorios = asyncHandler(async (req, res) => {
  await findOrFail(req.params.id);
  const accesorios = await colaboradorModel.findAccesoriosAsignados(req.params.id);
  res.status(200).json({ success: true, data: { accesorios } });
});

// GET /api/colaboradores/:id/impresoras
const getImpresoras = asyncHandler(async (req, res) => {
  await findOrFail(req.params.id);
  const impresoras = await colaboradorModel.findImpresorasAsignadas(req.params.id);
  res.status(200).json({ success: true, data: { impresoras } });
});

// GET /api/colaboradores/:id/celulares
const getCelulares = asyncHandler(async (req, res) => {
  await findOrFail(req.params.id);
  const celulares = await colaboradorModel.findCelularesAsignados(req.params.id);
  res.status(200).json({ success: true, data: { celulares } });
});

// GET /api/colaboradores/:id/vigentes  (todo lo que tiene hoy; base de la carta responsiva)
const getVigentes = asyncHandler(async (req, res) => {
  const colaborador = await findOrFail(req.params.id);
  const items = await colaboradorModel.findVigentes(colaborador.id);
  res.status(200).json({ success: true, data: { colaborador, items } });
});

// GET /api/colaboradores/:id/historial
const getHistorial = asyncHandler(async (req, res) => {
  await findOrFail(req.params.id);
  const historial = await colaboradorModel.findHistorial(req.params.id);
  res.status(200).json({ success: true, data: { historial } });
});

// POST /api/colaboradores
const create = asyncHandler(async (req, res) => {
  let colaborador;
  try {
    colaborador = await colaboradorModel.create(normalizeBody(req.body));
  } catch (err) {
    throw handleDbError(err);
  }
  await logAudit(null, {
    userId: req.user.id, ip: req.ip, action: 'creado', entity: ENTITY, entityId: colaborador.id,
    details: { nombre: colaborador.nombre_completo, id_empleado: colaborador.id_empleado },
  });
  res.status(201).json({ success: true, message: 'Colaborador creado correctamente.', data: { colaborador } });
});

// PUT /api/colaboradores/:id
const update = asyncHandler(async (req, res) => {
  const existing = await findOrFail(req.params.id);
  const data = normalizeBody(req.body);

  // No se puede dar de baja a alguien que aun tiene equipos, accesorios, impresoras o celulares a su cargo.
  const pendientes =
    existing.equipos_asignados + existing.accesorios_asignados +
    existing.impresoras_asignadas + existing.celulares_asignados;
  if (existing.activo && !data.activo && pendientes > 0) {
    throw new AppError(
      `No se puede dar de baja: el colaborador tiene ${existing.equipos_asignados} equipo(s), ${existing.accesorios_asignados} accesorio(s), ${existing.impresoras_asignadas} impresora(s) y ${existing.celulares_asignados} celular(es) asignado(s). Registra primero su devolución.`,
      409
    );
  }

  let colaborador;
  try {
    colaborador = await colaboradorModel.update(existing.id, data);
  } catch (err) {
    throw handleDbError(err);
  }

  const action = existing.activo && !colaborador.activo ? 'baja' : !existing.activo && colaborador.activo ? 'reactivado' : 'editado';
  await logAudit(null, {
    userId: req.user.id, ip: req.ip, action, entity: ENTITY, entityId: colaborador.id,
    details: { nombre: colaborador.nombre_completo },
  });

  res.status(200).json({ success: true, message: 'Colaborador actualizado correctamente.', data: { colaborador } });
});

// POST /api/colaboradores/:id/foto   (multipart, campo "foto")
const uploadFoto = asyncHandler(async (req, res) => {
  let existing;
  try {
    existing = await findOrFail(req.params.id);
  } catch (err) {
    removeFoto(req.file?.filename); // no dejar archivos huerfanos
    throw err;
  }

  await colaboradorModel.setFotografia(existing.id, req.file.filename);
  removeFoto(existing.fotografia);

  const colaborador = await colaboradorModel.findById(existing.id);
  res.status(200).json({ success: true, message: 'Fotografía actualizada.', data: { colaborador } });
});

// DELETE /api/colaboradores/:id/foto
const deleteFoto = asyncHandler(async (req, res) => {
  const existing = await findOrFail(req.params.id);
  await colaboradorModel.setFotografia(existing.id, null);
  removeFoto(existing.fotografia);

  const colaborador = await colaboradorModel.findById(existing.id);
  res.status(200).json({ success: true, message: 'Fotografía eliminada.', data: { colaborador } });
});

// GET /api/colaboradores/plantilla-importacion   (admin)
const plantillaImportacion = asyncHandler(async (req, res) => {
  const buffer = await libroDeUnaHoja('Colaboradores', colaboradorModel.COLUMNAS_IMPORTACION, []);
  res.set({
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': 'attachment; filename="plantilla-colaboradores.xlsx"',
  });
  res.send(buffer);
});

// POST /api/colaboradores/importar   (admin, multipart campo "archivo")
const importar = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Selecciona un archivo Excel (.xlsx).', 400);

  const filas = await leerHojaComoObjetos(req.file.buffer, colaboradorModel.COLUMNAS_IMPORTACION);
  if (!filas.length) throw new AppError('El archivo no tiene filas para importar.', 400);
  if (filas.length > 500) throw new AppError('Máximo 500 filas por importación.', 400);

  const { creados, errores } = await colaboradorModel.importar(filas);

  await logAudit(null, {
    userId: req.user.id, ip: req.ip, action: 'importados', entity: ENTITY, entityId: null,
    details: { creados, con_errores: errores.length, total_filas: filas.length },
  });

  res.status(200).json({
    success: true,
    message: `Se crearon ${creados} de ${filas.length} colaborador(es).`,
    data: { creados, total: filas.length, errores },
  });
});

module.exports = {
  list, stats, getById, getEquipos, getAccesorios, getImpresoras, getCelulares, getVigentes, getHistorial,
  create, update, uploadFoto, deleteFoto, plantillaImportacion, importar,
};
