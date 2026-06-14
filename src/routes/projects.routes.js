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

// Gestión de equipos del proyecto (solo el jefe del equipo dueño)
router.get('/:id/equipos-disponibles', requireProjectAccess, projectsController.getEquiposDisponibles);
router.post('/:id/equipos', requireProjectAccess, projectsController.addEquipo);
router.delete('/:id/equipos/:equipoId', requireProjectAccess, projectsController.removeEquipo);

module.exports = router;
