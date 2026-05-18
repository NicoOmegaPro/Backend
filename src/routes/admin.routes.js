const express = require('express');
const router = express.Router();

const users       = require('../controllers/admin/users.controller');
const roles       = require('../controllers/admin/roles.controller');
const tasks       = require('../controllers/admin/tasks.controller');
const projects    = require('../controllers/admin/projects.controller');
const equipos     = require('../controllers/admin/equipos.controller');
const sprints     = require('../controllers/admin/sprints.controller');
const subtareas   = require('../controllers/admin/subtareas.controller');
const comentarios = require('../controllers/admin/comentarios.controller');
const adjuntos    = require('../controllers/admin/adjuntos.controller');
const etiquetas   = require('../controllers/admin/etiquetas.controller');
const notificaciones = require('../controllers/admin/notificaciones.controller');
const historial   = require('../controllers/admin/historial.controller');

router.get('/', (req, res) => res.redirect('/admin/users'));

// Users
router.get('/users',              users.index);
router.get('/users/create',       users.create);
router.post('/users',             users.store);
router.get('/users/:id/edit',     users.edit);
router.post('/users/:id',         users.update);
router.post('/users/:id/delete',  users.destroy);

// Roles
router.get('/roles',              roles.index);
router.get('/roles/create',       roles.create);
router.post('/roles',             roles.store);
router.get('/roles/:id/edit',     roles.edit);
router.post('/roles/:id',         roles.update);
router.post('/roles/:id/delete',  roles.destroy);

// Tasks
router.get('/tasks',              tasks.index);
router.get('/tasks/create',       tasks.create);
router.post('/tasks',             tasks.store);
router.get('/tasks/:id/edit',     tasks.edit);
router.post('/tasks/:id',         tasks.update);
router.post('/tasks/:id/delete',  tasks.destroy);

// Projects
router.get('/projects',           projects.index);
router.get('/projects/create',    projects.create);
router.post('/projects',          projects.store);
router.get('/projects/:id/edit',  projects.edit);
router.post('/projects/:id',      projects.update);
router.post('/projects/:id/delete', projects.destroy);

// Equipos
router.get('/equipos',            equipos.index);
router.get('/equipos/create',     equipos.create);
router.post('/equipos',           equipos.store);
router.get('/equipos/:id/edit',   equipos.edit);
router.post('/equipos/:id',       equipos.update);
router.post('/equipos/:id/delete', equipos.destroy);

// Sprints
router.get('/sprints',            sprints.index);
router.get('/sprints/create',     sprints.create);
router.post('/sprints',           sprints.store);
router.get('/sprints/:id/edit',   sprints.edit);
router.post('/sprints/:id',       sprints.update);
router.post('/sprints/:id/delete', sprints.destroy);

// Subtareas
router.get('/subtareas',          subtareas.index);
router.get('/subtareas/create',   subtareas.create);
router.post('/subtareas',         subtareas.store);
router.get('/subtareas/:id/edit', subtareas.edit);
router.post('/subtareas/:id',     subtareas.update);
router.post('/subtareas/:id/delete', subtareas.destroy);

// Comentarios
router.get('/comentarios',        comentarios.index);
router.post('/comentarios/:id/delete', comentarios.destroy);

// Adjuntos
router.get('/adjuntos',           adjuntos.index);
router.post('/adjuntos/:id/delete', adjuntos.destroy);

// Etiquetas
router.get('/etiquetas',          etiquetas.index);
router.get('/etiquetas/create',   etiquetas.create);
router.post('/etiquetas',         etiquetas.store);
router.get('/etiquetas/:id/edit', etiquetas.edit);
router.post('/etiquetas/:id',     etiquetas.update);
router.post('/etiquetas/:id/delete', etiquetas.destroy);

// Notificaciones
router.get('/notificaciones',     notificaciones.index);
router.post('/notificaciones/:id/delete', notificaciones.destroy);

// Historial
router.get('/historial',          historial.index);

module.exports = router;
