const express = require('express');
const router = express.Router();
const subtareasController = require('../controllers/subtareas.controller');

router.get('/', subtareasController.getAllSubtareas);
router.get('/:id', subtareasController.getSubtareaById);
router.post('/', subtareasController.createSubtarea);
router.put('/:id', subtareasController.updateSubtarea);
router.delete('/:id', subtareasController.deleteSubtarea);

module.exports = router;
