const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const empresaModel = require('../models/empresaModel');
const { documentUploads } = require('../middleware/uploadMiddleware');
const { logAudit } = require('../utils/audit');

const OPTIONAL = ['rfc', 'direccion', 'telefono', 'correo', 'sitio_web', 'pie_documento', 'entrega_nombre', 'entrega_cargo', 'texto_declaracion', 'texto_condiciones',
  'descripcion', 'encabezado_documento'];

function normalize(body) {
  const data = { ...body };
  for (const key of OPTIONAL) {
    if (typeof data[key] === 'string') data[key] = data[key].trim() || null;
  }
  data.nombre = data.nombre.trim();
  data.folio_prefijo = String(data.folio_prefijo || 'CR').trim().toUpperCase();
  if (data.rfc) data.rfc = data.rfc.toUpperCase();
  return data;
}

// GET /api/empresa
const get = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: { empresa: await empresaModel.get() } });
});

// PUT /api/empresa   (admin)
const update = asyncHandler(async (req, res) => {
  const empresa = await empresaModel.update(normalize(req.body), req.user.id);
  await logAudit(null, { userId: req.user.id, ip: req.ip, action: 'actualizada', entity: 'empresa', entityId: 1 });
  res.status(200).json({ success: true, message: 'Información de la empresa actualizada.', data: { empresa } });
});

// PATCH /api/empresa/politica-seguridad   (admin)  { requiere_reautenticacion_sensible }
// Politica GLOBAL (no personal): a diferencia del resto de "Mi cuenta", esto
// aplica a TODOS los usuarios, por eso vive en Empresa y solo un admin la cambia.
const updatePoliticaSeguridad = asyncHandler(async (req, res) => {
  const empresa = await empresaModel.setPoliticaSeguridad(!!req.body.requiere_reautenticacion_sensible, req.user.id);
  await logAudit(null, {
    userId: req.user.id, ip: req.ip, action: 'politica_seguridad_actualizada', entity: 'empresa', entityId: 1,
    details: { requiere_reautenticacion_sensible: !!req.body.requiere_reautenticacion_sensible },
  });
  res.status(200).json({ success: true, message: 'Configuración de seguridad actualizada.', data: { empresa } });
});

// POST /api/empresa/logo   (admin, multipart campo "logo")
const uploadLogo = asyncHandler(async (req, res) => {
  const previous = (await empresaModel.getRaw()).logo;
  await empresaModel.setLogo(req.file.filename, req.user.id);
  documentUploads.logo.remove(previous);
  await logAudit(null, { userId: req.user.id, ip: req.ip, action: 'logo_actualizado', entity: 'empresa', entityId: 1 });
  res.status(200).json({ success: true, message: 'Logo actualizado.', data: { empresa: await empresaModel.get() } });
});

// DELETE /api/empresa/logo   (admin)
const deleteLogo = asyncHandler(async (req, res) => {
  const previous = (await empresaModel.getRaw()).logo;
  await empresaModel.setLogo(null, req.user.id);
  documentUploads.logo.remove(previous);
  await logAudit(null, { userId: req.user.id, ip: req.ip, action: 'logo_eliminado', entity: 'empresa', entityId: 1 });
  res.status(200).json({ success: true, message: 'Logo eliminado.', data: { empresa: await empresaModel.get() } });
});

// GET /api/empresa/logo   (cualquier usuario con sesion; el archivo nunca se expone por ruta)
const getLogo = asyncHandler(async (req, res, next) => {
  const { logo } = await empresaModel.getRaw();
  if (!logo) throw new AppError('La empresa no tiene logo.', 404);

  res.set({
    'Content-Type': logo.endsWith('.png') ? 'image/png' : 'image/jpeg',
    'Cache-Control': 'private, max-age=300',
    // El <img> del frontend vive en otro origen (puerto); helmet lo bloquearia por defecto.
    'Cross-Origin-Resource-Policy': 'cross-origin',
  });
  res.sendFile(documentUploads.logo.filePath(logo), { dotfiles: 'deny' }, (err) => {
    if (err) next(new AppError('No se pudo leer el logo.', 404));
  });
});

module.exports = { get, update, updatePoliticaSeguridad, uploadLogo, deleteLogo, getLogo };
