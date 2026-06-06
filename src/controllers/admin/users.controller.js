const prisma = require('../../prisma');
const bcrypt = require('bcrypt');
const { getPageParams, buildMeta } = require('../../utils/paginate');

const index = async (req, res) => {
  const { page, limit, skip } = getPageParams(req);
  const [users, total] = await Promise.all([
    prisma.usuario.findMany({ include: { rol: true }, orderBy: { id: 'asc' }, skip, take: limit }),
    prisma.usuario.count(),
  ]);
  res.render('users', { users, title: 'Usuarios', active: 'users', pagination: buildMeta({ page, limit, total }) });
};

const create = async (req, res) => {
  const roles = await prisma.rol.findMany();
  res.render('users_form', { user: null, roles, title: 'Nuevo Usuario', active: 'users' });
};

const store = async (req, res) => {
  try {
    const { nombre, email, password, descripcion, rolId } = req.body;
    const hash = await bcrypt.hash(password, 10);
    await prisma.usuario.create({ data: { nombre, email, password: hash, descripcion, rolId: parseInt(rolId) } });
  } catch (err) { console.error(err); }
  res.redirect('/admin/users');
};

const edit = async (req, res) => {
  const [user, roles] = await Promise.all([
    prisma.usuario.findUnique({ where: { id: parseInt(req.params.id) } }),
    prisma.rol.findMany()
  ]);
  res.render('users_form', { user, roles, title: 'Editar Usuario', active: 'users' });
};

const update = async (req, res) => {
  try {
    const { nombre, email, descripcion, rolId } = req.body;
    await prisma.usuario.update({ where: { id: parseInt(req.params.id) }, data: { nombre, email, descripcion, rolId: parseInt(rolId) } });
  } catch (err) { console.error(err); }
  res.redirect('/admin/users');
};

const destroy = async (req, res) => {
  try { await prisma.usuario.delete({ where: { id: parseInt(req.params.id) } }); } catch (err) { console.error(err); }
  res.redirect('/admin/users');
};

module.exports = { index, create, store, edit, update, destroy };
