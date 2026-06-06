const express = require('express');
const router = express.Router();
const notificacionesController = require('../controllers/notificaciones.controller');

router.get('/', notificacionesController.getAllNotificaciones);
router.put('/marcar-todas', notificacionesController.marcarTodasLeidas);
router.put('/:id', notificacionesController.updateNotificacion);
router.delete('/:id', notificacionesController.deleteNotificacion);

module.exports = router;
