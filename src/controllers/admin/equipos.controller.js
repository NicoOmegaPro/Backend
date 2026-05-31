const prisma = require('../../prisma');

const index = async (req, res) => {
  const equipos = await prisma.equipo.findMany({ include: { _count: { select: { usuarios: true } } }, orderBy: { id: 'asc' } });
  res.render('equipos', { equipos, title: 'Equipos', active: 'equipos' });
};

const create = async (req, res) => {
  const usuarios = await prisma.usuario.findMany({ orderBy: { nombre: 'asc' } });
  res.render('equipos_form', { equipo: null, usuarios, miembrosIds: [], title: 'Nuevo Equipo', active: 'equipos' });
};

const store = async (req, res) => {
  try {
    const { nombre, descripcion, miembros } = req.body;
    const equipo = await prisma.equipo.create({ data: { nombre, descripcion } });
    const ids = Array.isArray(miembros) ? miembros : miembros ? [miembros] : [];
    if (ids.length) {
      await prisma.equipoUsuario.createMany({
        data: ids.map(id => ({ equipoId: equipo.id, usuarioId: parseInt(id) }))
      });
    }
  } catch (err) { console.error(err); }
  res.redirect('/admin/equipos');
};

const edit = async (req, res) => {
  const id = parseInt(req.params.id);
  const [equipo, usuarios, miembros] = await Promise.all([
    prisma.equipo.findUnique({ where: { id } }),
    prisma.usuario.findMany({ orderBy: { nombre: 'asc' } }),
    prisma.equipoUsuario.findMany({ where: { equipoId: id } })
  ]);
  const miembrosIds = miembros.map(m => m.usuarioId);
  res.render('equipos_form', { equipo, usuarios, miembrosIds, title: 'Editar Equipo', active: 'equipos' });
};

const update = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre, descripcion, miembros } = req.body;
    await prisma.equipo.update({ where: { id }, data: { nombre, descripcion } });
    const ids = Array.isArray(miembros) ? miembros : miembros ? [miembros] : [];
    await prisma.equipoUsuario.deleteMany({ where: { equipoId: id } });
    if (ids.length) {
      await prisma.equipoUsuario.createMany({
        data: ids.map(uid => ({ equipoId: id, usuarioId: parseInt(uid) }))
      });
    }
  } catch (err) { console.error(err); }
  res.redirect('/admin/equipos');
};

const destroy = async (req, res) => {
  try { await prisma.equipo.delete({ where: { id: parseInt(req.params.id) } }); } catch (err) { console.error(err); }
  res.redirect('/admin/equipos');
};

module.exports = { index, create, store, edit, update, destroy };
