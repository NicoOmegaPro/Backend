const prisma = require('../../prisma');

const index = async (req, res) => {
  const equipos = await prisma.equipo.findMany({ include: { _count: { select: { usuarios: true } } }, orderBy: { id: 'asc' } });
  res.render('equipos', { equipos, title: 'Equipos', active: 'equipos' });
};

const create = (req, res) => {
  res.render('equipos_form', { equipo: null, title: 'Nuevo Equipo', active: 'equipos' });
};

const store = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    await prisma.equipo.create({ data: { nombre, descripcion } });
  } catch (err) { console.error(err); }
  res.redirect('/admin/equipos');
};

const edit = async (req, res) => {
  const equipo = await prisma.equipo.findUnique({ where: { id: parseInt(req.params.id) } });
  res.render('equipos_form', { equipo, title: 'Editar Equipo', active: 'equipos' });
};

const update = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    await prisma.equipo.update({ where: { id: parseInt(req.params.id) }, data: { nombre, descripcion } });
  } catch (err) { console.error(err); }
  res.redirect('/admin/equipos');
};

const destroy = async (req, res) => {
  try { await prisma.equipo.delete({ where: { id: parseInt(req.params.id) } }); } catch (err) { console.error(err); }
  res.redirect('/admin/equipos');
};

module.exports = { index, create, store, edit, update, destroy };
