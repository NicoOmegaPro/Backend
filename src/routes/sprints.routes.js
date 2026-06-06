const express = require('express');
const router = express.Router();
const sprintsController = require('../controllers/sprints.controller');
const { validate } = require('../utils/validate');
const { createSprintSchema, updateSprintSchema } = require('../utils/schemas');
const { requireBodyProjectAccess } = require('../utils/permissions');

router.get('/', sprintsController.getAllSprints);
router.get('/:id', sprintsController.getSprintById);
router.post('/', validate(createSprintSchema), requireBodyProjectAccess(), sprintsController.createSprint);
router.put('/:id', validate(updateSprintSchema), sprintsController.updateSprint);
router.delete('/:id', sprintsController.deleteSprint);

module.exports = router;
