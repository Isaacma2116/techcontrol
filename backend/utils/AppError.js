/**
 * Error de aplicacion con codigo de estado HTTP.
 * Permite lanzar errores "esperados" (validacion, 401, 403, 404, etc.)
 * y distinguirlos de errores inesperados en el manejador central.
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
