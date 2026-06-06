const prisma = require('../../prisma');
const { getPageParams, buildMeta } = require('../../utils/paginate');

const index = async (req, res) => {
  const { page, limit, skip } = getPageParams(req);
  const [subtareas, total] = await Promise.all([
    prisma.subtarea.findMany({ include: { tarea: { select: { titulo: true } } }, orderBy: { id: 'asc' }, skip, take: limit }),
    prisma.subtarea.count(),
  ]);
  res.render('subtareas', { subtareas, title: 'Subtareas', active: 'subtareas', pagination: buildMeta({ page, limit, total }) });
};

const create = async (req, res) => {
  const tasks = await prisma.tarea.findMany({ select: { id: true, titulo: true } });
  res.render('subtareas_form', { subtarea: null, tasks, title: 'Nueva Subtarea', active: 'subtareas' });
};

const store = async (req, res) => {
  try {
    const { titulo, tareaId, completada } = req.body;
    await prisma.subtarea.create({ data: { titulo, tareaId: parseInt(tareaId), completada: completada === 'on' } });
  } catch (err) { console.error(err); }
  res.redirect('/admin/subtareas');
};

const edit = async (req, res) => {
  const [subtarea, tasks] = await Promise.all([
    prisma.subtarea.findUnique({ where: { id: parseInt(req.params.id) } }),
    prisma.tarea.findMany({ select: { id: true, titulo: true } })
  ]);
  res.render('subtareas_form', { subtarea, tasks, title: 'Editar Subtarea', active: 'subtareas' });
};

const update = async (req, res) => {
  try {
    const { titulo, tareaId, completada } = req.body;
    await prisma.subtarea.update({ where: { id: parseInt(req.params.id) }, data: { titulo, tareaId: parseInt(tareaId), completada: completada === 'on' } });
  } catch (err) { console.error(err); }
  res.redirect('/admin/subtareas');
};

const destroy = async (req, res) => {
  try { await prisma.subtarea.delete({ where: { id: parseInt(req.params.id) } }); } catch (err) { console.error(err); }
  res.redirect('/admin/subtareas');
};

module.exports = { index, create, store, edit, update, destroy };
