const express = require('express');
const router = express.Router();
const comentariosController = require('../controllers/comentarios.controller');
const { validate } = require('../utils/validate');
const { createComentarioSchema } = require('../utils/schemas');
const { requireBodyTaskAccess } = require('../utils/permissions');

router.get('/', comentariosController.getAllComentarios);
router.get('/:id', comentariosController.getComentarioById);
router.post('/', validate(createComentarioSchema), requireBodyTaskAccess(), comentariosController.createComentario);
router.delete('/:id', comentariosController.deleteComentario);

module.exports = router;
