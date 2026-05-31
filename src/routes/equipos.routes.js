const express = require('express');
const router = express.Router();
const c = require('../controllers/equipos.controller');

router.get('/',    c.getAllEquipos);
router.get('/:id', c.getEquipoById);
router.post('/',   c.createEquipo);
router.put('/:id', c.updateEquipo);
router.delete('/:id', c.deleteEquipo);

// Invitaciones
router.post('/:id/invitar',    c.invitarMiembro);
router.put('/:id/aceptar',     c.aceptarInvitacion);
router.delete('/:id/rechazar', c.rechazarInvitacion);

// Gestión de miembros (solo JEFE_EQUIPO)
router.delete('/:id/miembros/:userId',  c.expulsarMiembro);

module.exports = router;
