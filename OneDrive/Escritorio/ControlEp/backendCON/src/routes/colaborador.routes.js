const express = require('express');
const router = express.Router();
const colaboradorController = require('../controllers/colaborador.controller');
const upload = require('../config/multer.config');
const authMiddleware = require('../middlewares/auth.middleware'); // Importa el middleware de autenticación

// Verificación de métodos del controlador
console.log('Métodos del controlador:', {
  create: typeof colaboradorController.create,
  findAll: typeof colaboradorController.findAll,
  findOne: typeof colaboradorController.findOne,
  update: typeof colaboradorController.update,
  delete: typeof colaboradorController.delete
});

// Rutas CRUD protegidas (excepto findAll y findOne si quieres que sean públicas)
router.post('/', authMiddleware, upload.single('foto'), colaboradorController.create);
router.get('/', colaboradorController.findAll); // Puedes dejarlo público o protegerlo
router.get('/:id', colaboradorController.findOne); // Puedes dejarlo público o protegerlo
router.put('/:id', authMiddleware, upload.single('foto'), colaboradorController.update);
router.delete('/:id', authMiddleware, colaboradorController.delete);

module.exports = router;