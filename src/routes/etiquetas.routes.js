const express = require('express');
const router = express.Router();
const etiquetasController = require('../controllers/etiquetas.controller');

router.get('/', etiquetasController.getAllEtiquetas);
router.get('/:id', etiquetasController.getEtiquetaById);
router.post('/', etiquetasController.createEtiqueta);
router.put('/:id', etiquetasController.updateEtiqueta);
router.delete('/:id', etiquetasController.deleteEtiqueta);

module.exports = router;
