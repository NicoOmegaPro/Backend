const prisma = require('../../prisma');
const bcrypt = require('bcrypt');
const { getPageParams, buildMeta } = require('../../utils/paginate');

const toBool = (v) => ['on', 'true', '1', true].includes(v);

const index = async (req, res) => {
  const { page, limit, skip } = getPageParams(req);
  const [users, total] = await Promise.all([
    prisma.usuario.findMany({ orderBy: { id: 'asc' }, skip, take: limit }),
    prisma.usuario.count(),
  ]);
  res.render('users', { users, title: 'Usuarios', active: 'users', pagination: buildMeta({ page, limit, total }) });
};

const create = async (req, res) => {
  res.render('users_form', { user: null, title: 'Nuevo Usuario', active: 'users' });
};

const store = async (req, res) => {
  try {
    const { nombre, email, password, descripcion, esAdmin } = req.body;
    const hash = await bcrypt.hash(password, 10);
    await prisma.usuario.create({ data: { nombre, email, password: hash, descripcion, esAdmin: toBool(esAdmin) } });
  } catch (err) { console.error(err); }
  res.redirect('/admin/users');
};

const edit = async (req, res) => {
  const user = await prisma.usuario.findUnique({ where: { id: parseInt(req.params.id) } });
  res.render('users_form', { user, title: 'Editar Usuario', active: 'users' });
};

const update = async (req, res) => {
  try {
    const { nombre, email, descripcion, esAdmin } = req.body;
    await prisma.usuario.update({ where: { id: parseInt(req.params.id) }, data: { nombre, email, descripcion, esAdmin: toBool(esAdmin) } });
  } catch (err) { console.error(err); }
  res.redirect('/admin/users');
};

const destroy = async (req, res) => {
  try { await prisma.usuario.delete({ where: { id: parseInt(req.params.id) } }); } catch (err) { console.error(err); }
  res.redirect('/admin/users');
};

module.exports = { index, create, store, edit, update, destroy };
