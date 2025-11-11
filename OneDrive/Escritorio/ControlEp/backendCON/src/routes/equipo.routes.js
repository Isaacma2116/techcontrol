const express = require('express');
const router = express.Router();
const equipoController = require('../controllers/equipo.controller');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Asegura que el directorio exista
const uploadDir = path.join(__dirname, '../../uploads/equipos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de Multer para subir fotos a uploads/equipos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, ''));
  }
});
const upload = multer({ storage: storage });

router.get('/', equipoController.getAllEquipos);
router.get('/:id', equipoController.getEquipoById);
router.post('/', upload.single('foto_equipo'), equipoController.createEquipo);
router.put('/:id', upload.single('foto_equipo'), equipoController.updateEquipo);
router.delete('/:id', equipoController.deleteEquipo);

module.exports = router;