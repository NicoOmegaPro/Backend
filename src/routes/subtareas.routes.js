const express = require('express');
const router = express.Router();
const subtareasController = require('../controllers/subtareas.controller');
const { validate } = require('../utils/validate');
const { createSubtareaSchema, updateSubtareaSchema } = require('../utils/schemas');
const { requireBodyTaskAccess } = require('../utils/permissions');

router.get('/', subtareasController.getAllSubtareas);
router.get('/:id', subtareasController.getSubtareaById);
router.post('/', validate(createSubtareaSchema), requireBodyTaskAccess(), subtareasController.createSubtarea);
router.put('/:id', validate(updateSubtareaSchema), subtareasController.updateSubtarea);
router.delete('/:id', subtareasController.deleteSubtarea);

module.exports = router;
