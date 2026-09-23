const express = require('express');
const { exportar } = require('../controllers/datosController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { requireReciente } = require('../middleware/reautenticacion');

const router = express.Router();

router.use(protect, authorize('admin'));
router.get('/exportar', requireReciente(), exportar);

module.exports = router;
