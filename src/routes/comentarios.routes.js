const express = require('express');
const router = express.Router();
const comentariosController = require('../controllers/comentarios.controller');

router.get('/', comentariosController.getAllComentarios);
router.get('/:id', comentariosController.getComentarioById);
router.post('/', comentariosController.createComentario);
router.put('/:id', comentariosController.updateComentario);
router.delete('/:id', comentariosController.deleteComentario);

module.exports = router;
