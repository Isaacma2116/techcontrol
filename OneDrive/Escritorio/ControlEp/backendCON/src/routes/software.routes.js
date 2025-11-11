const express = require('express');
const router = express.Router();

// Importa el controlador correctamente
const softwareController = require('../controllers/software.controller');

// Rutas básicas CRUD
router.get('/', softwareController.getAll);
router.get('/:id', softwareController.getById);
router.post('/', softwareController.create);
router.put('/:id', softwareController.update);
router.delete('/:id', softwareController.delete);

module.exports = router;