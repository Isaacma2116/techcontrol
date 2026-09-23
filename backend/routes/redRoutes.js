const express = require('express');
const { body, param, query } = require('express-validator');
const controller = require('../controllers/redController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/roleMiddleware');
const { requireReciente } = require('../middleware/reautenticacion');
const validateRequest = require('../middleware/validateRequest');
const { TIPOS_RED, ESTADOS_RED, SEGURIDAD_WIFI } = require('../utils/redes');

const router = express.Router();

const idParam = [param('id').isInt({ min: 1 }).withMessage('Identificador inválido.'), validateRequest];

const text = (field, max, label) =>
  body(field).optional({ values: 'falsy' }).trim().isLength({ max }).withMessage(`${label} no puede superar ${max} caracteres.`);

const CIDR_REGEX = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
const IP_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;

const redValidation = [
  body('nombre').trim().notEmpty().withMessage('El nombre de la red es obligatorio.').bail()
    .isLength({ max: 150 }).withMessage('El nombre no puede superar 150 caracteres.'),
  body('tipo').isIn(TIPOS_RED).withMessage('Tipo de red inválido.'),
  body('ubicacion_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Ubicación inválida.'),
  body('area_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Área inválida.'),
  body('vlan_numero').optional({ values: 'falsy' }).isInt({ min: 1, max: 4094 }).withMessage('El VLAN ID debe ser un número entre 1 y 4094.'),
  body('rango_ip').optional({ values: 'falsy' }).trim().matches(CIDR_REGEX).withMessage('Ingresa un rango válido, ej. 192.168.10.0/24.'),
  body('gateway').optional({ values: 'falsy' }).trim().matches(IP_REGEX).withMessage('Ingresa una IP de gateway válida.'),
  text('dns', 190, 'El DNS'),
  body('dhcp_habilitado').optional().isBoolean().withMessage('Valor inválido.'),
  body('seguridad_wifi').optional({ values: 'falsy' }).isIn(SEGURIDAD_WIFI).withMessage('Tipo de seguridad inválido.'),
  body('wifi_password').optional({ values: 'null' }).isLength({ max: 128 }).withMessage('La contraseña es demasiado larga.'),
  body('responsable_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Responsable inválido.'),
  text('descripcion', 500, 'La descripción'),
  validateRequest,
];

const listValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 200 }),
  query('search').optional({ values: 'falsy' }).trim().isLength({ max: 120 }),
  query('tipo').optional({ values: 'falsy' }).isIn(TIPOS_RED),
  query('estado').optional({ values: 'falsy' }).isIn(ESTADOS_RED),
  query('ubicacion_id').optional({ values: 'falsy' }).isInt({ min: 1 }),
  query('area_id').optional({ values: 'falsy' }).isInt({ min: 1 }),
  validateRequest,
];

router.use(protect);

router.get('/', requirePermission('redes.ver'), listValidation, controller.list);
router.get('/todas', requirePermission('redes.ver'), controller.listAll);
router.get('/stats', requirePermission('redes.ver'), controller.stats);
router.get('/:id', requirePermission('redes.ver'), idParam, controller.getById);
router.get('/:id/dispositivos', requirePermission('redes.ver'), idParam, controller.dispositivos);
router.get('/:id/historial', requirePermission('redes.ver'), idParam, controller.historial);

router.post('/', requirePermission('redes.crear'), redValidation, controller.create);
router.put('/:id', requirePermission('redes.editar'), idParam, redValidation, controller.update);
router.patch('/:id/estado', requirePermission('redes.eliminar'), idParam, body('estado').isIn(ESTADOS_RED).withMessage('Estado inválido.'), validateRequest, controller.setEstado);

// Revelar la contraseña Wi-Fi: permiso aparte + (si la empresa activo la politica en
// Configuracion > Empresa > Configuracion de seguridad) haber confirmado la
// contrasena hace poco (POST /api/perfil/verificar-password, que SI tiene su propio
// limite de intentos). Antes exigia escribir la contrasena en CADA revelada; ahora
// es configurable por la empresa, asi que aqui ya no hay una contrasena que adivinar.
router.post(
  '/:id/password',
  requirePermission('redes.ver_contrasenas'),
  requireReciente(),
  idParam,
  validateRequest,
  controller.revelarPassword
);

module.exports = router;
