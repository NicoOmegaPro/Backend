const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const adjuntosController = require('../controllers/adjuntos.controller');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../public/uploads'));
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()) || allowed.test(file.mimetype));
  },
});

// Upload file → returns { rutaLocal, nombre, url }
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
  res.json({
    rutaLocal: `/uploads/${req.file.filename}`,
    nombre: req.file.originalname,
    url: `/uploads/${req.file.filename}`,
  });
});

router.get('/', adjuntosController.getAllAdjuntos);
router.get('/:id', adjuntosController.getAdjuntoById);
router.post('/', adjuntosController.createAdjunto);
router.put('/:id', adjuntosController.updateAdjunto);
router.delete('/:id', adjuntosController.deleteAdjunto);

module.exports = router;
