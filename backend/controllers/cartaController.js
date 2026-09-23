const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const cartaModel = require('../models/cartaModel');
const { documentUploads } = require('../middleware/uploadMiddleware');
const { logAudit } = require('../utils/audit');

const OPTIONAL_TEXT = ['observaciones', 'condiciones_especiales', 'entrega_nombre', 'entrega_cargo', 'fecha_devolucion_esperada'];

function normalizeBody(body) {
  const data = { ...body };
  for (const key of OPTIONAL_TEXT) {
    if (typeof data[key] === 'string') data[key] = data[key].trim() || null;
  }
  return data;
}

async function findOrFail(id) {
  const carta = await cartaModel.findById(id);
  if (!carta) throw new AppError('Carta no encontrada.', 404);
  return carta;
}

/**
 * Envia un documento guardado en /storage. La ruta interna nunca sale del servidor:
 * el archivo se busca por el nombre guardado en la base y se sirve con el tipo
 * registrado, sin que el navegador lo interprete (nosniff) ni lo guarde en cache.
 */
function sendDocumento(res, next, doc, { filename, disposition }) {
  res.set({
    'Content-Type': doc.mime,
    'Content-Disposition': `${disposition}; filename="${filename}"`,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.sendFile(documentUploads.cartas.filePath(doc.archivo), { dotfiles: 'deny', cacheControl: false }, (err) => {
    if (err) next(new AppError('No se encontró el archivo del documento.', 404));
  });
}

const extFromMime = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' };

// GET /api/cartas-responsivas?search=&tipo=&estado=a,b&desde=&hasta=&area_id=&page=&limit=
const list = asyncHandler(async (req, res) => {
  const { search, tipo, estado, desde, hasta, area_id } = req.query;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;

  const { rows, total } = await cartaModel.findAll(
    {
      search: search?.trim(),
      tipo: tipo || undefined,
      estados: estado ? estado.split(',') : undefined,
      desde: desde || undefined,
      hasta: hasta || undefined,
      areaId: area_id ? Number(area_id) : undefined,
    },
    { page, limit }
  );
  res.status(200).json({
    success: true,
    data: { cartas: rows, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } },
  });
});

const stats = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: { stats: await cartaModel.getStats() } });
});

const getById = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: { carta: await findOrFail(req.params.id) } });
});

const getHistorial = asyncHandler(async (req, res) => {
  await findOrFail(req.params.id);
  res.status(200).json({ success: true, data: { historial: await cartaModel.findHistorial(req.params.id) } });
});

// POST /api/cartas-responsivas
const create = asyncHandler(async (req, res) => {
  const id = await cartaModel.create(normalizeBody(req.body), req.user.id, req.ip);
  res.status(201).json({ success: true, message: 'Borrador de carta creado.', data: { carta: await cartaModel.findById(id) } });
});

// PUT /api/cartas-responsivas/:id   (solo borrador)
const update = asyncHandler(async (req, res) => {
  await cartaModel.update(Number(req.params.id), normalizeBody(req.body), req.user.id, req.ip);
  res.status(200).json({ success: true, message: 'Borrador actualizado.', data: { carta: await cartaModel.findById(req.params.id) } });
});

// GET /api/cartas-responsivas/:id/preview   (PDF de un borrador con marca de agua; no se guarda)
const preview = asyncHandler(async (req, res) => {
  const buffer = await cartaModel.renderPreview(Number(req.params.id));
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'inline; filename="vista-previa.pdf"',
    'Cache-Control': 'private, no-store',
  });
  res.status(200).send(buffer);
});

// POST /api/cartas-responsivas/:id/generar
const generar = asyncHandler(async (req, res) => {
  await cartaModel.generar(Number(req.params.id), req.user.id, req.ip);
  res.status(200).json({ success: true, message: 'PDF generado correctamente.', data: { carta: await cartaModel.findById(req.params.id) } });
});

// GET /api/cartas-responsivas/:id/pdf[?descargar=1]
// Con descargar=1 se registra la descarga y, la primera vez, la carta pasa a PENDIENTE_FIRMA.
const getPdf = asyncHandler(async (req, res, next) => {
  const carta = await findOrFail(req.params.id);
  const doc = await cartaModel.getDocumento(carta.id, 'generado');
  if (!doc) throw new AppError('El PDF aún no se ha generado.', 404);

  const descargar = req.query.descargar === '1';
  if (descargar) await cartaModel.registrarDescarga(carta.id, 'generado', req.user.id, req.ip);
  sendDocumento(res, next, doc, { filename: `${carta.folio}.pdf`, disposition: descargar ? 'attachment' : 'inline' });
});

// POST /api/cartas-responsivas/:id/firmada   (multipart, campo "archivo")
const subirFirmada = asyncHandler(async (req, res) => {
  await cartaModel.subirFirmada(Number(req.params.id), req.file, {
    fechaFirma: req.body.fecha_firma || undefined,
    userId: req.user.id,
    isAdmin: req.user.role === 'admin',
    ip: req.ip,
  });
  res.status(200).json({ success: true, message: 'Carta firmada registrada.', data: { carta: await cartaModel.findById(req.params.id) } });
});

// GET /api/cartas-responsivas/:id/firmada
const getFirmada = asyncHandler(async (req, res, next) => {
  const carta = await findOrFail(req.params.id);
  const doc = await cartaModel.getDocumento(carta.id, 'firmado');
  if (!doc) throw new AppError('Esta carta aún no tiene documento firmado.', 404);

  await cartaModel.registrarDescarga(carta.id, 'firmado', req.user.id, req.ip);
  sendDocumento(res, next, doc, { filename: `${carta.folio}-firmada.${extFromMime[doc.mime]}`, disposition: 'inline' });
});

// GET /api/cartas-responsivas/:id/documentos/:docId   (admin: cualquier version, incluidas las reemplazadas)
const getDocumento = asyncHandler(async (req, res, next) => {
  const carta = await findOrFail(req.params.id);
  const doc = await cartaModel.getDocumentoById(carta.id, req.params.docId);
  if (!doc) throw new AppError('Documento no encontrado.', 404);

  await logAudit(null, {
    userId: req.user.id, ip: req.ip, action: 'documento_descargado', entity: 'carta_responsiva', entityId: carta.id,
    details: { documento: doc.id, tipo: doc.tipo, version: doc.version },
  });
  const suffix = doc.tipo === 'generado' ? '' : `-${doc.tipo}-v${doc.version}`;
  sendDocumento(res, next, doc, { filename: `${carta.folio}${suffix}.${extFromMime[doc.mime]}`, disposition: 'inline' });
});

// POST /api/cartas-responsivas/:id/cancelar
const cancelar = asyncHandler(async (req, res) => {
  await cartaModel.cancelar(Number(req.params.id), req.body.motivo?.trim(), {
    userId: req.user.id,
    isAdmin: req.user.role === 'admin',
    ip: req.ip,
  });
  res.status(200).json({ success: true, message: 'Carta cancelada.', data: { carta: await cartaModel.findById(req.params.id) } });
});

module.exports = {
  list, stats, getById, getHistorial, create, update, preview, generar, getPdf,
  subirFirmada, getFirmada, getDocumento, cancelar,
};
