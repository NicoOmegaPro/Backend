const prisma = require('../../prisma');

const index = async (req, res) => {
  const roles = await prisma.rol.findMany({ include: { _count: { select: { usuarios: true } } }, orderBy: { id: 'asc' } });
  res.render('roles', { roles, title: 'Roles', active: 'roles' });
};

const create = (req, res) => {
  res.render('roles_form', { rol: null, title: 'Nuevo Rol', active: 'roles' });
};

const store = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    await prisma.rol.create({ data: { nombre, descripcion } });
  } catch (err) { console.error(err); }
  res.redirect('/admin/roles');
};

const edit = async (req, res) => {
  const rol = await prisma.rol.findUnique({ where: { id: parseInt(req.params.id) } });
  res.render('roles_form', { rol, title: 'Editar Rol', active: 'roles' });
};

const update = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    await prisma.rol.update({ where: { id: parseInt(req.params.id) }, data: { nombre, descripcion } });
  } catch (err) { console.error(err); }
  res.redirect('/admin/roles');
};

const destroy = async (req, res) => {
  try { await prisma.rol.delete({ where: { id: parseInt(req.params.id) } }); } catch (err) { console.error(err); }
  res.redirect('/admin/roles');
};

module.exports = { index, create, store, edit, update, destroy };
