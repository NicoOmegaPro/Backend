const express = require('express');
const router = express.Router();
const tasksController = require('../controllers/tasks.controller');
const { validate } = require('../utils/validate');
const { createTaskSchema, updateTaskSchema } = require('../utils/schemas');
const { requireTaskAccess, requireBodyProjectAccess } = require('../utils/permissions');

router.get('/', tasksController.getAllTasks);
router.put('/reorder', tasksController.reorderTasks);

router.post('/', validate(createTaskSchema), requireBodyProjectAccess(), tasksController.createTask);

router.get('/:id', requireTaskAccess, tasksController.getTaskById);
router.put('/:id', validate(updateTaskSchema), requireTaskAccess, tasksController.updateTask);
router.delete('/:id', requireTaskAccess, tasksController.deleteTask);

router.post('/:id/etiquetas', requireTaskAccess, tasksController.addEtiqueta);
router.delete('/:id/etiquetas/:etiquetaId', requireTaskAccess, tasksController.removeEtiqueta);

module.exports = router;
