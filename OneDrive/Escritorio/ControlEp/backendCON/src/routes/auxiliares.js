const express = require('express');
const router = express.Router();
const auxiliarController = require('../controllers/auxiliarController');

router.post('/', auxiliarController.createAuxiliar);
router.get('/', auxiliarController.getAuxiliares);
router.get('/:id', auxiliarController.getAuxiliarById);
router.put('/:id', auxiliarController.updateAuxiliar);
router.delete('/:id', auxiliarController.deleteAuxiliar);

module.exports = router;