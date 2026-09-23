const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Corta la peticion con 400 si alguna validacion de express-validator fallo.
 * Ademas del mensaje general devuelve `errors` ({ campo: mensaje }) para que
 * el formulario pueda marcar cada campo. El primer error de cada campo gana.
 */
function validateRequest(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = {};
  for (const err of result.array()) {
    if (err.path && !errors[err.path]) errors[err.path] = err.msg;
  }

  const error = new AppError(result.array()[0].msg, 400);
  error.errors = errors;
  next(error);
}

module.exports = validateRequest;
