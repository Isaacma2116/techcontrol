const express = require('express');
const { body } = require('express-validator');
const { makeCatalogoController } = require('../controllers/catalogoController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { CATALOGOS, READONLY } = require('../models/catalogoModel');

const router = express.Router();

const nombreValidation = [
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres.'),
  validateRequest,
];

router.use(protect);

const staff = authorize('admin', 'technician');

// Areas y cargos: datos de personal, solo admin/tecnico.
// Tipos de equipo/accesorio/impresora y ubicaciones: los ve cualquier usuario
// (los necesita el filtro de Inventario); crearlos requiere admin/tecnico.
for (const tipo of CATALOGOS) {
  const { list, create } = makeCatalogoController(tipo);
  const publicRead = tipo.startsWith('tipos-') || tipo === 'ubicaciones' || tipo === 'categorias-software';
  router.get(`/${tipo}`, ...(publicRead ? [] : [staff]), list);
  if (!READONLY.has(tipo)) router.post(`/${tipo}`, staff, nombreValidation, create);
}

module.exports = router;
