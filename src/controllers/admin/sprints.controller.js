const prisma = require('../../prisma');

const fmt = (date) => date ? new Date(date).toLocaleDateString('es-ES') : '-';
const isoDate = (date) => date ? new Date(date).toISOString().split('T')[0] : '';

const index = async (req, res) => {
  const sprints = await prisma.sprint.findMany({ include: { proyecto: { select: { nombre: true } } }, orderBy: { id: 'asc' } });
  res.render('sprints', { sprints, title: 'Sprints', active: 'sprints', fmt });
};

const create = async (req, res) => {
  const projects = await prisma.proyecto.findMany({ select: { id: true, nombre: true } });
  res.render('sprints_form', { sprint: null, projects, title: 'Nuevo Sprint', active: 'sprints', isoDate });
};

const store = async (req, res) => {
  try {
    const { nombre, fechaInicio, fechaFin, proyectoId } = req.body;
    await prisma.sprint.create({ data: { nombre, fechaInicio: new Date(fechaInicio), fechaFin: new Date(fechaFin), proyectoId: parseInt(proyectoId) } });
  } catch (err) { console.error(err); }
  res.redirect('/admin/sprints');
};

const edit = async (req, res) => {
  const [sprint, projects] = await Promise.all([
    prisma.sprint.findUnique({ where: { id: parseInt(req.params.id) } }),
    prisma.proyecto.findMany({ select: { id: true, nombre: true } })
  ]);
  res.render('sprints_form', { sprint, projects, title: 'Editar Sprint', active: 'sprints', isoDate });
};

const update = async (req, res) => {
  try {
    const { nombre, fechaInicio, fechaFin, proyectoId } = req.body;
    await prisma.sprint.update({ where: { id: parseInt(req.params.id) }, data: { nombre, fechaInicio: new Date(fechaInicio), fechaFin: new Date(fechaFin), proyectoId: parseInt(proyectoId) } });
  } catch (err) { console.error(err); }
  res.redirect('/admin/sprints');
};

const destroy = async (req, res) => {
  try { await prisma.sprint.delete({ where: { id: parseInt(req.params.id) } }); } catch (err) { console.error(err); }
  res.redirect('/admin/sprints');
};

module.exports = { index, create, store, edit, update, destroy };
