const express = require('express');
const router = express.Router();
const projectsController = require('../controllers/projects.controller');
const { validate } = require('../utils/validate');
const { createProjectSchema, updateProjectSchema } = require('../utils/schemas');
const { requireProjectAccess } = require('../utils/permissions');

router.get('/', projectsController.getAllProjects);
router.post('/', validate(createProjectSchema), projectsController.createProject);

router.get('/:id', requireProjectAccess, projectsController.getProjectById);
router.put('/:id', validate(updateProjectSchema), requireProjectAccess, projectsController.updateProject);
router.delete('/:id', requireProjectAccess, projectsController.deleteProject);

module.exports = router;
