const prisma = require('../../prisma');

const index = async (req, res) => {
  const tasks = await prisma.tarea.findMany({
    include: { proyecto: { select: { nombre: true } }, asignadoA: { select: { nombre: true } } },
    orderBy: { id: 'asc' }
  });
  res.render('tasks', { tasks, title: 'Tareas', active: 'tasks' });
};

const create = async (req, res) => {
  const [projects, users, sprints] = await Promise.all([
    prisma.proyecto.findMany({ select: { id: true, nombre: true } }),
    prisma.usuario.findMany({ select: { id: true, nombre: true } }),
    prisma.sprint.findMany({ select: { id: true, nombre: true } })
  ]);
  res.render('tasks_form', { task: null, projects, users, sprints, title: 'Nueva Tarea', active: 'tasks' });
};

const store = async (req, res) => {
  try {
    const { titulo, descripcion, estado, prioridad, proyectoId, asignadoAId, sprintId } = req.body;
    await prisma.tarea.create({
      data: {
        titulo, descripcion,
        estado: estado || 'PENDIENTE',
        prioridad: prioridad || 'MEDIA',
        proyectoId: parseInt(proyectoId),
        asignadoAId: asignadoAId ? parseInt(asignadoAId) : null,
        sprintId: sprintId ? parseInt(sprintId) : null
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
  res.render('tasks_form', { task, projects, users, sprints, title: 'Editar Tarea', active: 'tasks' });
};

const update = async (req, res) => {
  try {
    const { titulo, descripcion, estado, prioridad, proyectoId, asignadoAId, sprintId } = req.body;
    await prisma.tarea.update({
      where: { id: parseInt(req.params.id) },
      data: {
        titulo, descripcion, estado, prioridad,
        proyectoId: parseInt(proyectoId),
        asignadoAId: asignadoAId ? parseInt(asignadoAId) : null,
        sprintId: sprintId ? parseInt(sprintId) : null
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
