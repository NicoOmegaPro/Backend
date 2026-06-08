const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const c = require('../controllers/equipos.controller');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../public/uploads')),
  filename: (req, file, cb) => {
    const unique = `equipo-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()) || allowed.test(file.mimetype));
  },
});

router.get('/',    c.getAllEquipos);
router.get('/:id', c.getEquipoById);
router.post('/',   c.createEquipo);
router.put('/:id', c.updateEquipo);
router.delete('/:id', c.deleteEquipo);
router.post('/:id/imagen', uploadImage.single('image'), c.uploadImagenEquipo);

router.post('/:id/invitar',    c.invitarMiembro);
router.put('/:id/aceptar',     c.aceptarInvitacion);
router.delete('/:id/rechazar', c.rechazarInvitacion);

router.put('/:id/miembros/:userId/rol', c.cambiarRolMiembro);
router.delete('/:id/miembros/:userId',  c.expulsarMiembro);

module.exports = router;
