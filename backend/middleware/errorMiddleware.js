const AppError = require('../utils/AppError');

/**
 * 404 para rutas no definidas.
 */
function notFound(req, res, next) {
  next(new AppError(`Ruta no encontrada: ${req.originalUrl}`, 404));
}

/**
 * Manejador de errores centralizado.
 * - Errores "operacionales" (AppError) devuelven su mensaje y codigo tal cual.
 * - Errores inesperados devuelven un mensaje generico y se registran
 *   en el servidor; el stack trace NUNCA se envia en produccion.
 */
function errorHandler(err, req, res, next) {
  const isProduction = process.env.NODE_ENV === 'production';

  const statusCode = err.statusCode && err.isOperational ? err.statusCode : 500;
  const message = err.isOperational ? err.message : 'Error interno del servidor.';

  if (!err.isOperational) {
    console.error('[ERROR NO CONTROLADO]', err);
  }

  const response = { success: false, message };

  // Errores por campo (validacion de formularios), solo para errores esperados.
  if (err.isOperational && err.errors) {
    response.errors = err.errors;
  }

  if (!isProduction && !err.isOperational) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = { notFound, errorHandler };
