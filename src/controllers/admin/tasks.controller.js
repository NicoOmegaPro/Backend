const prisma = require('../../prisma');
const { getPageParams, buildMeta } = require('../../utils/paginate');

const fmt = (date) => date ? new Date(date).toLocaleDateString('es-ES') : '-';
const isoDate = (date) => date ? new Date(date).toISOString().split('T')[0] : '';

const index = async (req, res) => {
  const { page, limit, skip } = getPageParams(req);
  const [tasks, total] = await Promise.all([
    prisma.tarea.findMany({
      include: { proyecto: { select: { nombre: true } }, asignadoA: { select: { nombre: true } } },
      orderBy: { id: 'asc' },
      skip, take: limit,
    }),
    prisma.tarea.count(),
  ]);
  res.render('tasks', { tasks, title: 'Tareas', active: 'tasks', fmt, pagination: buildMeta({ page, limit, total }) });
};

const create = async (req, res) => {
  const [projects, users, sprints] = await Promise.all([
    prisma.proyecto.findMany({ select: { id: true, nombre: true } }),
    prisma.usuario.findMany({ select: { id: true, nombre: true } }),
    prisma.sprint.findMany({ select: { id: true, nombre: true } })
  ]);
  res.render('tasks_form', { task: null, projects, users, sprints, title: 'Nueva Tarea', active: 'tasks', isoDate });
};

const store = async (req, res) => {
  try {
    const { titulo, descripcion, estado, prioridad, proyectoId, asignadoAId, sprintId, fechaVencimiento } = req.body;
    await prisma.tarea.create({
      data: {
        titulo, descripcion,
        estado: estado || 'PENDIENTE',
        prioridad: prioridad || 'MEDIA',
        proyectoId: parseInt(proyectoId),
        asignadoAId: asignadoAId ? parseInt(asignadoAId) : null,
        sprintId: sprintId ? parseInt(sprintId) : null,
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null
      }
    });
  } catch (err) { console.error(err); }
  res.redirect('/admin/tasks');
};

const edit = async (req, res) => {
  const [task, projects, users, sprints] = await Promise.all([
    prisma.tarea.findUnique({ where: { id: parseInt(req.params.id) } }),
    prisma.proyecto.findMany({ select: { id: true, nombre: true } }),
    prisma.usuario.findMany({ select: { id: true, nombre: true } }),
    prisma.sprint.findMany({ select: { id: true, nombre: true } })
  ]);
  res.render('tasks_form', { task, projects, users, sprints, title: 'Editar Tarea', active: 'tasks', isoDate });
};

const update = async (req, res) => {
  try {
    const { titulo, descripcion, estado, prioridad, proyectoId, asignadoAId, sprintId, fechaVencimiento } = req.body;
    await prisma.tarea.update({
      where: { id: parseInt(req.params.id) },
      data: {
        titulo, descripcion, estado, prioridad,
        proyectoId: parseInt(proyectoId),
        asignadoAId: asignadoAId ? parseInt(asignadoAId) : null,
        sprintId: sprintId ? parseInt(sprintId) : null,
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null
      }
    });
  } catch (err) { console.error(err); }
  res.redirect('/admin/tasks');
};

const destroy = async (req, res) => {
  try { await prisma.tarea.delete({ where: { id: parseInt(req.params.id) } }); } catch (err) { console.error(err); }
  res.redirect('/admin/tasks');
};

module.exports = { index, create, store, edit, update, destroy };
