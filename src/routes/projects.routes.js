const express = require('express');
const router = express.Router();
const projectsController = require('../controllers/projects.controller');

router.get('/', projectsController.getAllProjects);
router.get('/:id', projectsController.getProjectById);
router.post('/', projectsController.createProject);
router.put('/:id', projectsController.updateProject);
router.delete('/:id', projectsController.deleteProject);

// Gestión de miembros y roles dentro del proyecto
router.post('/:id/miembros', projectsController.addProjectMember);
router.put('/:id/miembros/:userId', projectsController.updateProjectMember);
router.delete('/:id/miembros/:userId', projectsController.removeProjectMember);

module.exports = router;
