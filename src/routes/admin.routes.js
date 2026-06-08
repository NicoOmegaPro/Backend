const express = require('express');
const router = express.Router();

const users       = require('../controllers/admin/users.controller');
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

router.get('/users',              users.index);
router.get('/users/create',       users.create);
router.post('/users',             users.store);
router.get('/users/:id/edit',     users.edit);
router.post('/users/:id',         users.update);
router.post('/users/:id/delete',  users.destroy);

router.get('/tasks',              tasks.index);
router.get('/tasks/create',       tasks.create);
router.post('/tasks',             tasks.store);
router.get('/tasks/:id/edit',     tasks.edit);
router.post('/tasks/:id',         tasks.update);
router.post('/tasks/:id/delete',  tasks.destroy);

router.get('/projects',           projects.index);
router.get('/projects/create',    projects.create);
router.post('/projects',          projects.store);
router.get('/projects/:id/edit',  projects.edit);
router.post('/projects/:id',      projects.update);
router.post('/projects/:id/delete', projects.destroy);

router.get('/equipos',            equipos.index);
router.get('/equipos/create',     equipos.create);
router.post('/equipos',           equipos.store);
router.get('/equipos/:id/edit',   equipos.edit);
router.post('/equipos/:id',       equipos.update);
router.post('/equipos/:id/delete', equipos.destroy);

router.get('/sprints',            sprints.index);
router.get('/sprints/create',     sprints.create);
router.post('/sprints',           sprints.store);
router.get('/sprints/:id/edit',   sprints.edit);
router.post('/sprints/:id',       sprints.update);
router.post('/sprints/:id/delete', sprints.destroy);

router.get('/subtareas',          subtareas.index);
router.get('/subtareas/create',   subtareas.create);
router.post('/subtareas',         subtareas.store);
router.get('/subtareas/:id/edit', subtareas.edit);
router.post('/subtareas/:id',     subtareas.update);
router.post('/subtareas/:id/delete', subtareas.destroy);

router.get('/comentarios',            comentarios.index);
router.get('/comentarios/create',     comentarios.create);
router.post('/comentarios',           comentarios.store);
router.get('/comentarios/:id/edit',   comentarios.edit);
router.post('/comentarios/:id',       comentarios.update);
router.post('/comentarios/:id/delete', comentarios.destroy);

router.get('/adjuntos',           adjuntos.index);
router.get('/adjuntos/create',    adjuntos.create);
router.post('/adjuntos',          adjuntos.store);
router.get('/adjuntos/:id/edit',  adjuntos.edit);
router.post('/adjuntos/:id',      adjuntos.update);
router.post('/adjuntos/:id/delete', adjuntos.destroy);

router.get('/etiquetas',          etiquetas.index);
router.get('/etiquetas/create',   etiquetas.create);
router.post('/etiquetas',         etiquetas.store);
router.get('/etiquetas/:id/edit', etiquetas.edit);
router.post('/etiquetas/:id',     etiquetas.update);
router.post('/etiquetas/:id/delete', etiquetas.destroy);

router.get('/notificaciones',            notificaciones.index);
router.get('/notificaciones/create',     notificaciones.create);
router.post('/notificaciones',           notificaciones.store);
router.get('/notificaciones/:id/edit',   notificaciones.edit);
router.post('/notificaciones/:id',       notificaciones.update);
router.post('/notificaciones/:id/delete', notificaciones.destroy);

router.get('/historial',            historial.index);
router.get('/historial/create',     historial.create);
router.post('/historial',           historial.store);
router.get('/historial/:id/edit',   historial.edit);
router.post('/historial/:id',       historial.update);
router.post('/historial/:id/delete', historial.destroy);

module.exports = router;
