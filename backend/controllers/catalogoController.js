const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const catalogoModel = require('../models/catalogoModel');

const LABELS = {
  areas: 'área',
  cargos: 'cargo',
  'tipos-equipo': 'tipo de equipo',
  'tipos-accesorio': 'tipo de accesorio',
  'tipos-impresora': 'tipo de impresora',
  ubicaciones: 'ubicación',
  'categorias-software': 'categoría de software',
};

/**
 * Fabrica los handlers de un catalogo simple (areas | cargos | tipos-equipo | tipos-accesorio | tipos-impresora | ubicaciones).
 * `tipo` viene de la definicion de rutas, no del request.
 */
function makeCatalogoController(tipo) {
  const list = asyncHandler(async (req, res) => {
    const items = await catalogoModel.findAll(tipo);
    res.status(200).json({ success: true, data: { items } });
  });

  const create = asyncHandler(async (req, res) => {
    try {
      const item = await catalogoModel.create(tipo, req.body.nombre);
      res.status(201).json({ success: true, data: { item } });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw new AppError(`Ya existe un ${LABELS[tipo]} con ese nombre.`, 409);
      }
      throw err;
    }
  });

  return { list, create };
}

module.exports = { makeCatalogoController };
