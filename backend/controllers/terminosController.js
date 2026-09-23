const asyncHandler = require('../utils/asyncHandler');
const { VERSION, ACTUALIZADO_EL, SECCIONES } = require('../utils/terminos');
const { renderTerminosPdf } = require('../utils/terminosPdf');
const empresaModel = require('../models/empresaModel');

// GET /api/terminos
const get = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: { version: VERSION, actualizado_el: ACTUALIZADO_EL, secciones: SECCIONES } });
});

// GET /api/terminos/pdf
const getPdf = asyncHandler(async (req, res) => {
  const empresa = await empresaModel.get();
  const buffer = await renderTerminosPdf(empresa.nombre);
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename="terminos-y-condiciones.pdf"',
  });
  res.send(buffer);
});

module.exports = { get, getPdf };
