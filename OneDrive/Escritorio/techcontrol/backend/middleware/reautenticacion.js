const empresaModel = require('../models/empresaModel');
const sessionModel = require('../models/sessionModel');

/**
 * Paso adicional para datos sensibles (Wi-Fi, importaciones, exportaciones
 * completas...): si la empresa activo la politica ("Configuracion > Empresa >
 * Configuracion de seguridad"), exige que ESTA sesion haya confirmado la
 * contrasena en los ultimos `minutos` (POST /api/perfil/verificar-password).
 * Si la politica esta apagada, no hace nada (deja pasar).
 */
function requireReciente(minutos = 15) {
  return async (req, res, next) => {
    try {
      if (!(await empresaModel.requiereReautenticacion())) return next();
      if (await sessionModel.estaReautenticado(req.sessionId, minutos)) return next();

      res.status(401).json({
        success: false,
        code: 'REAUTH_REQUIRED',
        message: 'Por seguridad, confirma tu contraseña de nuevo para continuar.',
      });
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { requireReciente };
