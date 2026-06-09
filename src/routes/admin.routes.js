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

function resource(name, controller) {
  router.get(`/${name}`,              controller.index);
  router.get(`/${name}/create`,       controller.create);
  router.post(`/${name}`,             controller.store);
  router.get(`/${name}/:id/edit`,     controller.edit);
  router.post(`/${name}/:id`,         controller.update);
  router.post(`/${name}/:id/delete`,  controller.destroy);
}

router.get('/', (req, res) => res.redirect('/admin/users'));

resource('users', users);
resource('tasks', tasks);
resource('projects', projects);
resource('equipos', equipos);
resource('sprints', sprints);
resource('subtareas', subtareas);
resource('comentarios', comentarios);
resource('adjuntos', adjuntos);
resource('etiquetas', etiquetas);
resource('notificaciones', notificaciones);
resource('historial', historial);

module.exports = router;
