const express = require('express');
const router = express.Router();
const sprintsController = require('../controllers/sprints.controller');

router.get('/', sprintsController.getAllSprints);
router.get('/:id', sprintsController.getSprintById);
router.post('/', sprintsController.createSprint);
router.put('/:id', sprintsController.updateSprint);
router.delete('/:id', sprintsController.deleteSprint);

module.exports = router;
