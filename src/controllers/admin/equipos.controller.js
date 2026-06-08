const prisma = require('../../prisma');
const { getPageParams, buildMeta } = require('../../utils/paginate');

const ROLES = ['JEFE_EQUIPO', 'SUPERVISOR', 'MIEMBRO'];
const ESTADOS = ['ACEPTADO', 'PENDIENTE', 'RECHAZADO'];

const index = async (req, res) => {
  const { page, limit, skip } = getPageParams(req);
  const [equipos, total] = await Promise.all([
    prisma.equipo.findMany({ include: { _count: { select: { usuarios: true, proyectos: true } } }, orderBy: { id: 'asc' }, skip, take: limit }),
    prisma.equipo.count(),
  ]);
  res.render('equipos', { equipos, title: 'Equipos', active: 'equipos', pagination: buildMeta({ page, limit, total }) });
};

const create = async (req, res) => {
  const usuarios = await prisma.usuario.findMany({ orderBy: { nombre: 'asc' } });
  res.render('equipos_form', { equipo: null, usuarios, miembros: {}, title: 'Nuevo Equipo', active: 'equipos' });
};

function leerMiembros(body) {
  const ids = Array.isArray(body.miembros) ? body.miembros : body.miembros ? [body.miembros] : [];
  return ids.map((uid) => ({
    usuarioId: parseInt(uid),
    rol: ROLES.includes(body['rol_' + uid]) ? body['rol_' + uid] : 'MIEMBRO',
    estado: ESTADOS.includes(body['estado_' + uid]) ? body['estado_' + uid] : 'ACEPTADO',
  }));
}

const store = async (req, res) => {
  try {
    const { nombre, descripcion, imagen } = req.body;
    const equipo = await prisma.equipo.create({ data: { nombre, descripcion, imagen: imagen || null } });
    const miembros = leerMiembros(req.body);
    if (miembros.length) {
      await prisma.equipoUsuario.createMany({
        data: miembros.map((m) => ({ equipoId: equipo.id, ...m })),
      });
    }
  } catch (err) { console.error(err); }
  res.redirect('/admin/equipos');
};

const edit = async (req, res) => {
  const id = parseInt(req.params.id);
  const [equipo, usuarios, filas] = await Promise.all([
    prisma.equipo.findUnique({ where: { id } }),
    prisma.usuario.findMany({ orderBy: { nombre: 'asc' } }),
    prisma.equipoUsuario.findMany({ where: { equipoId: id } }),
  ]);
  const miembros = {};
  filas.forEach((f) => { miembros[f.usuarioId] = { rol: f.rol, estado: f.estado }; });
  res.render('equipos_form', { equipo, usuarios, miembros, title: 'Editar Equipo', active: 'equipos' });
};

const update = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre, descripcion, imagen } = req.body;
    await prisma.equipo.update({ where: { id }, data: { nombre, descripcion, imagen: imagen || null } });
    const miembros = leerMiembros(req.body);
    await prisma.equipoUsuario.deleteMany({ where: { equipoId: id } });
    if (miembros.length) {
      await prisma.equipoUsuario.createMany({
        data: miembros.map((m) => ({ equipoId: id, ...m })),
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
