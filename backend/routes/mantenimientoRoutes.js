const express = require('express');
const { body, param, query } = require('express-validator');
const controller = require('../controllers/mantenimientoController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');
const {
  TIPOS, PRIORIDADES, ESTADOS_FILTRO, ACCIONES_COMPONENTE, MAX_COMPONENTES, RECURSOS,
} = require('../utils/mantenimientos');

const router = express.Router();

const DATE_FORMAT = { format: 'YYYY-MM-DD', strictMode: true, delimiters: ['-'] };
const TIPOS_RECURSO = Object.keys(RECURSOS);

const idParam = [param('id').isInt({ min: 1 }).withMessage('Identificador inválido.'), validateRequest];

const text = (field, max, label) =>
  body(field).optional({ values: 'falsy' }).trim()
    .isLength({ max }).withMessage(`${label} no puede superar ${max} caracteres.`);

const fechaRule = (field, label) =>
  body(field).notEmpty().withMessage(`${label} es obligatoria.`).bail()
    .isDate(DATE_FORMAT).withMessage(`${label} no es válida.`);

const horaRule = body('hora_programada').optional({ values: 'falsy' })
  .matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/).withMessage('La hora no es válida (HH:MM).');

const costoRule = (field) =>
  body(field).optional({ values: 'null' }).custom((v) => {
    if (v === '' || v === undefined) return true;
    if (!Number.isFinite(Number(v)) || Number(v) < 0 || Number(v) > 99999999.99) {
      throw new Error('El costo debe ser un número mayor o igual a cero.');
    }
    return true;
  });

// Lista de componentes cambiados: se valida elemento por elemento para poder
// devolver un mensaje entendible (el formulario la manda completa).
const componentesRule = body('componentes').optional({ values: 'falsy' }).custom((lista) => {
  if (!Array.isArray(lista)) throw new Error('Los componentes deben enviarse como lista.');
  if (lista.length > MAX_COMPONENTES) throw new Error(`Máximo ${MAX_COMPONENTES} componentes.`);
  lista.forEach((c, i) => {
    const n = i + 1;
    if (!c || typeof c !== 'object') throw new Error(`Componente ${n}: formato inválido.`);
    if (!ACCIONES_COMPONENTE.includes(c.accion)) throw new Error(`Componente ${n}: acción inválida.`);
    if (typeof c.componente !== 'string' || !c.componente.trim()) throw new Error(`Componente ${n}: falta el nombre.`);
    if (c.componente.length > 100) throw new Error(`Componente ${n}: el nombre no puede superar 100 caracteres.`);
    if (c.detalle && String(c.detalle).length > 255) throw new Error(`Componente ${n}: el detalle no puede superar 255 caracteres.`);
    if (c.numero_serie && String(c.numero_serie).length > 120) throw new Error(`Componente ${n}: la serie no puede superar 120 caracteres.`);
    if (c.costo !== undefined && c.costo !== null && c.costo !== '' && !(Number(c.costo) >= 0)) {
      throw new Error(`Componente ${n}: el costo debe ser un número mayor o igual a cero.`);
    }
  });
  return true;
});

const unidadRules = [
  body('tipo_recurso').isIn(TIPOS_RECURSO).withMessage('Selecciona el tipo de unidad.'),
  body('recurso_id').isInt({ min: 1 }).withMessage('Selecciona la unidad.'),
];

const agendarValidation = [
  ...unidadRules,
  body('tipo').isIn(TIPOS).withMessage('El tipo de mantenimiento debe ser preventivo o correctivo.'),
  body('prioridad').optional({ values: 'falsy' }).isIn(PRIORIDADES).withMessage('Prioridad inválida.'),
  fechaRule('fecha_programada', 'La fecha programada'),
  horaRule,
  text('motivo', 2000, 'El motivo'),
  text('observaciones', 2000, 'Las observaciones'),
  body('responsable_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Responsable inválido.'),
  validateRequest,
];

const realizarValidation = [
  body('trabajo_realizado').trim().notEmpty().withMessage('Describe lo que se realizó.').bail()
    .isLength({ max: 5000 }).withMessage('La descripción no puede superar 5000 caracteres.'),
  body('fecha_realizado').optional({ values: 'falsy' }).isDate(DATE_FORMAT).withMessage('La fecha no es válida.'),
  costoRule('costo'),
  text('proveedor', 150, 'El proveedor'),
  body('responsable_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Responsable inválido.'),
  componentesRule,
  validateRequest,
];

const reprogramarValidation = [
  fechaRule('fecha_programada', 'La fecha nueva'),
  horaRule,
  text('motivo', 255, 'El motivo'),
  validateRequest,
];

const cancelarValidation = [
  body('motivo').trim().notEmpty().withMessage('Indica por qué se cancela.').bail()
    .isLength({ max: 255 }).withMessage('El motivo no puede superar 255 caracteres.'),
  validateRequest,
];

const listValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Página inválida.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite inválido.'),
  query('desde').optional({ values: 'falsy' }).isDate(DATE_FORMAT).withMessage('La fecha "desde" no es válida.'),
  query('hasta').optional({ values: 'falsy' }).isDate(DATE_FORMAT).withMessage('La fecha "hasta" no es válida.'),
  query('tipo').optional({ values: 'falsy' }).isIn(TIPOS).withMessage('Tipo inválido.'),
  query('estado').optional({ values: 'falsy' }).isIn(ESTADOS_FILTRO).withMessage('Estado inválido.'),
  query('prioridad').optional({ values: 'falsy' }).isIn(PRIORIDADES).withMessage('Prioridad inválida.'),
  query('tipo_recurso').optional({ values: 'falsy' }).isIn(TIPOS_RECURSO).withMessage('Tipo de unidad inválido.'),
  query('recurso_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Unidad inválida.'),
  query('search').optional({ values: 'falsy' }).trim().isLength({ max: 120 }).withMessage('La búsqueda es demasiado larga.'),
  validateRequest,
];

router.use(protect);

// Consultar: cualquier usuario con sesion (el calendario es informacion de trabajo).
router.get('/', requirePermission('mantenimientos.ver'), listValidation, controller.list);
router.get('/stats', requirePermission('mantenimientos.ver'), controller.stats);
router.get('/:id', requirePermission('mantenimientos.ver'), idParam, controller.getById);
router.get('/:id/historial', requirePermission('mantenimientos.ver'), idParam, controller.historial);

// Operar: admin y tecnico.
router.post('/', requirePermission('mantenimientos.programar'), agendarValidation, controller.create);
router.put('/:id', requirePermission('mantenimientos.programar'), idParam, agendarValidation, controller.update);
router.post('/:id/iniciar', requirePermission('mantenimientos.realizar'), idParam, controller.iniciar);
router.post('/:id/realizar', requirePermission('mantenimientos.realizar'), idParam, realizarValidation, controller.realizar);
router.post('/:id/reprogramar', requirePermission('mantenimientos.programar'), idParam, reprogramarValidation, controller.reprogramar);
router.post('/:id/cancelar', requirePermission('mantenimientos.cancelar'), idParam, cancelarValidation, controller.cancelar);

module.exports = router;
