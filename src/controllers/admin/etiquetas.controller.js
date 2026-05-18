const prisma = require('../../prisma');

const index = async (req, res) => {
  const etiquetas = await prisma.etiqueta.findMany({ include: { _count: { select: { tareas: true } } }, orderBy: { id: 'asc' } });
  res.render('etiquetas', { etiquetas, title: 'Etiquetas', active: 'etiquetas' });
};

const create = (req, res) => {
  res.render('etiquetas_form', { etiqueta: null, title: 'Nueva Etiqueta', active: 'etiquetas' });
};

const store = async (req, res) => {
  try {
    const { nombre, color } = req.body;
    await prisma.etiqueta.create({ data: { nombre, color } });
  } catch (err) { console.error(err); }
  res.redirect('/admin/etiquetas');
};

const edit = async (req, res) => {
  const etiqueta = await prisma.etiqueta.findUnique({ where: { id: parseInt(req.params.id) } });
  res.render('etiquetas_form', { etiqueta, title: 'Editar Etiqueta', active: 'etiquetas' });
};

const update = async (req, res) => {
  try {
    const { nombre, color } = req.body;
    await prisma.etiqueta.update({ where: { id: parseInt(req.params.id) }, data: { nombre, color } });
  } catch (err) { console.error(err); }
  res.redirect('/admin/etiquetas');
};

const destroy = async (req, res) => {
  try { await prisma.etiqueta.delete({ where: { id: parseInt(req.params.id) } }); } catch (err) { console.error(err); }
  res.redirect('/admin/etiquetas');
};

module.exports = { index, create, store, edit, update, destroy };
