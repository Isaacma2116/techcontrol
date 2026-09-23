const express = require('express');
const multer = require('multer');
const { body, param, query } = require('express-validator');
const controller = require('../controllers/colaboradorController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadFoto } = require('../middleware/uploadMiddleware');
const { requireReciente } = require('../middleware/reautenticacion');
const AppError = require('../utils/AppError');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

// El Excel de importacion nunca se guarda en disco: se lee en memoria y se descarta.
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const uploadExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== XLSX_MIME) return cb(new AppError('El archivo debe ser un Excel (.xlsx).', 400));
    cb(null, true);
  },
}).single('archivo');

const PHONE_REGEX = /^[0-9+()\-\s.]{7,25}$/;
const DATE_FORMAT = { format: 'YYYY-MM-DD', strictMode: true, delimiters: ['-'] };

const idParam = [param('id').isInt({ min: 1 }).withMessage('Identificador inválido.'), validateRequest];

const listValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Página inválida.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite inválido.'),
  query('area_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Área inválida.'),
  query('cargo_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Cargo inválido.'),
  query('activo').optional({ values: 'falsy' }).isIn(['true', 'false', '1', '0']).withMessage('Estado inválido.'),
  query('asignacion').optional({ values: 'falsy' }).isIn(['con', 'sin']).withMessage('Filtro de asignación inválido.'),
  validateRequest,
];

// Mismas reglas para crear y editar (el formulario siempre envia todos los campos).
const colaboradorValidation = [
  body('id_empleado')
    .trim()
    .notEmpty().withMessage('El ID de empleado es obligatorio.').bail()
    .isLength({ max: 30 }).withMessage('El ID de empleado no puede superar 30 caracteres.').bail()
    .matches(/^[A-Za-z0-9._-]+$/).withMessage('Solo letras, números, puntos, guiones y guion bajo.'),
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio.').bail()
    .isLength({ max: 100 }).withMessage('El nombre no puede superar 100 caracteres.'),
  body('apellido_paterno')
    .trim()
    .notEmpty().withMessage('El apellido paterno es obligatorio.').bail()
    .isLength({ max: 100 }).withMessage('El apellido no puede superar 100 caracteres.'),
  body('apellido_materno')
    .optional({ values: 'falsy' }).trim()
    .isLength({ max: 100 }).withMessage('El apellido no puede superar 100 caracteres.'),
  body('area_id').isInt({ min: 1 }).withMessage('Selecciona un área.').toInt(),
  body('cargo_id').isInt({ min: 1 }).withMessage('Selecciona un cargo.').toInt(),
  body('correo_empresarial')
    .optional({ values: 'falsy' }).trim()
    .isEmail().withMessage('Ingresa un correo empresarial válido.').bail()
    .isLength({ max: 190 }).withMessage('El correo es demasiado largo.'),
  body('telefono_empresarial')
    .optional({ values: 'falsy' }).trim()
    .matches(PHONE_REGEX).withMessage('Ingresa un teléfono válido (7 a 25 dígitos).'),
  body('correo_personal')
    .optional({ values: 'falsy' }).trim()
    .isEmail().withMessage('Ingresa un correo personal válido.').bail()
    .isLength({ max: 190 }).withMessage('El correo es demasiado largo.'),
  body('telefono_personal')
    .optional({ values: 'falsy' }).trim()
    .matches(PHONE_REGEX).withMessage('Ingresa un teléfono válido (7 a 25 dígitos).'),
  body('fecha_alta')
    .notEmpty().withMessage('La fecha de ingreso es obligatoria.').bail()
    .isDate(DATE_FORMAT).withMessage('La fecha de ingreso no es válida.'),
  body('activo').isBoolean().withMessage('Estado inválido.').bail().toBoolean(),
  body('fecha_baja').custom((value, { req }) => {
    if (req.body.activo === true) return true; // activo: la baja se ignora
    if (!value) throw new Error('Indica la fecha de baja.');
    if (!isValidDate(value)) throw new Error('La fecha de baja no es válida.');
    if (req.body.fecha_alta && value < req.body.fecha_alta) {
      throw new Error('La fecha de baja no puede ser anterior a la de ingreso.');
    }
    return true;
  }),
  validateRequest,
];

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value);
}

// Datos personales: solo administradores y tecnicos.
router.use(protect, authorize('admin', 'technician'));

// Rutas fijas antes de '/:id'
router.get('/stats', controller.stats);
router.get('/', listValidation, controller.list);
router.post('/', colaboradorValidation, controller.create);

// Importacion masiva (Configuracion > Datos y respaldos): solo admin, y solo si
// ya confirmo su contrasena hace poco cuando esa politica esta activa.
router.get('/plantilla-importacion', authorize('admin'), controller.plantillaImportacion);
router.post('/importar', authorize('admin'), requireReciente(), uploadExcel, controller.importar);

router.get('/:id', idParam, controller.getById);
router.put('/:id', idParam, colaboradorValidation, controller.update);
router.get('/:id/equipos', idParam, controller.getEquipos);
router.get('/:id/accesorios', idParam, controller.getAccesorios);
router.get('/:id/impresoras', idParam, controller.getImpresoras);
router.get('/:id/celulares', idParam, controller.getCelulares);
router.get('/:id/vigentes', idParam, controller.getVigentes);
router.get('/:id/historial', idParam, controller.getHistorial);
router.post('/:id/foto', idParam, uploadFoto, controller.uploadFoto);
router.delete('/:id/foto', idParam, controller.deleteFoto);

module.exports = router;
