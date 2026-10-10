const express = require('express');
const {
  list, noLeidas, marcarLeida, marcarTodasLeidas, getPreferencias, guardarPreferencias,
} = require('../controllers/notificacionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/', list);
router.get('/no-leidas', noLeidas);
router.get('/preferencias', getPreferencias);
router.put('/preferencias', guardarPreferencias);
router.patch('/:id/leida', marcarLeida);
router.post('/marcar-todas', marcarTodasLeidas);

module.exports = router;
