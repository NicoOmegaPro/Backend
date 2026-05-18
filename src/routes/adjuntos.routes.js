const express = require('express');
const router = express.Router();
const adjuntosController = require('../controllers/adjuntos.controller');

router.get('/', adjuntosController.getAllAdjuntos);
router.get('/:id', adjuntosController.getAdjuntoById);
router.post('/', adjuntosController.createAdjunto);
router.put('/:id', adjuntosController.updateAdjunto);
router.delete('/:id', adjuntosController.deleteAdjunto);

module.exports = router;
