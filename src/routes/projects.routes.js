const express = require('express');
const router = express.Router();
const projectsController = require('../controllers/projects.controller');
const { validate } = require('../utils/validate');
const {
  createProjectSchema,
  updateProjectSchema,
  projectMemberSchema,
  updateProjectMemberSchema,
} = require('../utils/schemas');
const { requireProjectAccess } = require('../utils/permissions');

router.get('/', projectsController.getAllProjects);
router.post('/', validate(createProjectSchema), projectsController.createProject);

router.get('/:id', requireProjectAccess, projectsController.getProjectById);
router.put('/:id', validate(updateProjectSchema), requireProjectAccess, projectsController.updateProject);
router.delete('/:id', requireProjectAccess, projectsController.deleteProject);

// Gestión de miembros y roles dentro del proyecto
router.post('/:id/miembros', validate(projectMemberSchema), requireProjectAccess, projectsController.addProjectMember);
router.put('/:id/miembros/:userId', validate(updateProjectMemberSchema), requireProjectAccess, projectsController.updateProjectMember);
router.delete('/:id/miembros/:userId', requireProjectAccess, projectsController.removeProjectMember);

module.exports = router;
