/**
 * Envuelve controladores async para que cualquier error
 * (rechazo de promesa) se pase automaticamente a next(err),
 * evitando try/catch repetido en cada controlador.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
