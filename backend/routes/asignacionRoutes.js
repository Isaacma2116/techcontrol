const express = require('express');
const { body, param } = require('express-validator');
const { makeAsignacionController } = require('../controllers/asignacionController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { CONDICIONES, ESTADOS_MANUALES, KINDS, localDateString } = require('../utils/inventario');

const DATE_FORMAT = { format: 'YYYY-MM-DD', strictMode: true, delimiters: ['-'] };

const notFuture = (label) => (value) => {
  if (value > localDateString()) throw new Error(`${label} no puede ser futura.`);
  return true;
};

const router = express.Router();

// Asignar y devolver: solo administradores y tecnicos.
router.use(protect, authorize('admin', 'technician'));

for (const kind of Object.keys(KINDS)) {
  const cfg = KINDS[kind];
  const controller = makeAsignacionController(kind);

  // POST /api/asignaciones/equipos      { equipo_id, colaborador_id, fecha_asignacion?, observaciones? }
  // POST /api/asignaciones/accesorios   { accesorio_id, colaborador_id, ... }
  // POST /api/asignaciones/impresoras   { impresora_id, ... }   |   /celulares   { celular_id, ... }
  router.post(
    `/${kind}`,
    [
      body(cfg.asigFk).isInt({ min: 1 }).withMessage(`Selecciona ${cfg.art} ${cfg.label}.`),
      body('colaborador_id').isInt({ min: 1 }).withMessage('Selecciona el colaborador.'),
      body('fecha_asignacion').optional({ values: 'falsy' })
        .isDate(DATE_FORMAT).withMessage('La fecha de asignación no es válida.').bail()
        .custom(notFuture('La fecha de asignación')),
      body('observaciones').optional({ values: 'falsy' }).trim()
        .isLength({ max: 1000 }).withMessage('Las observaciones no pueden superar 1000 caracteres.'),
      validateRequest,
    ],
    controller.assign
  );

  // POST /api/asignaciones/equipos/:id/devolver   (:id = id de la ASIGNACION)
  router.post(
    `/${kind}/:id/devolver`,
    [
      param('id').isInt({ min: 1 }).withMessage('Identificador inválido.'),
      body('condicion').isIn(CONDICIONES).withMessage('Indica en qué condición se devuelve.'),
      body('fecha_devolucion').optional({ values: 'falsy' })
        .isDate(DATE_FORMAT).withMessage('La fecha de devolución no es válida.').bail()
        .custom(notFuture('La fecha de devolución')),
      body('nuevo_estado').optional({ values: 'falsy' }).isIn(ESTADOS_MANUALES).withMessage('Estado posterior inválido.'),
      body('observaciones').optional({ values: 'falsy' }).trim()
        .isLength({ max: 1000 }).withMessage('Las observaciones no pueden superar 1000 caracteres.'),
      validateRequest,
    ],
    controller.devolver
  );
}

module.exports = router;
