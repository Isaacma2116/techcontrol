const express = require('express');
const { get, getPdf } = require('../controllers/terminosController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Visibles para cualquier usuario con sesion (no son informacion restringida por rol).
router.use(protect);
router.get('/', get);
router.get('/pdf', getPdf);

module.exports = router;
