const express = require('express');
const router = express.Router();
const controller = require('../controllers/equiposPersonalizacion.controller');

// Obtener todas las personalizaciones
router.get('/', controller.getAll);

// Obtener la personalización de un equipo específico
router.get('/:equipo_id', controller.getByEquipoId);

// Crear o actualizar la personalización de un equipo
router.post('/', controller.upsert);

module.exports = router;