const AppError = require('../utils/AppError');
const { can } = require('../utils/permisos');

/**
 * Middleware de autorizacion por rol.
 * Uso: router.delete('/:id', protect, authorize('admin'), controller)
 *
 * Se mantiene simple (lista de roles permitidos) a proposito;
 * la arquitectura permite mas adelante evolucionar a permisos
 * granulares (ej. tabla permissions) sin cambiar las rutas que
 * ya usan este middleware.
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('No autenticado.', 401));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('No tienes permisos para realizar esta accion.', 403));
    }
    next();
  };
}

/**
 * Autorizacion por PERMISO (ver utils/permisos.js):
 *   router.post('/:id/generar', requirePermission('cartas.generar'), controller)
 * Equivale a authorize(...roles) pero sin listar roles en cada ruta.
 */
function requirePermission(permiso) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('No autenticado.', 401));
    }
    if (!can(req.user.role, permiso)) {
      return next(new AppError('No tienes permisos para realizar esta accion.', 403));
    }
    next();
  };
}

module.exports = { authorize, requirePermission };
