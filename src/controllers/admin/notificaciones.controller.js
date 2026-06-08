const prisma = require('../../prisma');
const { getPageParams, buildMeta } = require('../../utils/paginate');

const fmt = (date) => date ? new Date(date).toLocaleDateString('es-ES') : '-';

const index = async (req, res) => {
  const { page, limit, skip } = getPageParams(req);
  const [notificaciones, total] = await Promise.all([
    prisma.notificacion.findMany({
      include: { usuario: { select: { nombre: true } } },
      orderBy: { fecha: 'desc' },
      skip, take: limit,
    }),
    prisma.notificacion.count(),
  ]);
  res.render('notificaciones', { notificaciones, title: 'Notificaciones', active: 'notificaciones', fmt, pagination: buildMeta({ page, limit, total }) });
};

async function usuarios() {
  return prisma.usuario.findMany({ select: { id: true, nombre: true }, orderBy: { nombre: 'asc' } });
}

const create = async (req, res) => {
  res.render('notificaciones_form', { notificacion: null, usuarios: await usuarios(), title: 'Nueva Notificación', active: 'notificaciones' });
};

const store = async (req, res) => {
  try {
    const { mensaje, tipo, usuarioId, leida } = req.body;
    await prisma.notificacion.create({ data: { mensaje, tipo, usuarioId: parseInt(usuarioId), leida: leida === 'on' } });
  } catch (err) { console.error(err); }
  res.redirect('/admin/notificaciones');
};

const edit = async (req, res) => {
  const notificacion = await prisma.notificacion.findUnique({ where: { id: parseInt(req.params.id) } });
  res.render('notificaciones_form', { notificacion, usuarios: await usuarios(), title: 'Editar Notificación', active: 'notificaciones' });
};

const update = async (req, res) => {
  try {
    const { mensaje, tipo, usuarioId, leida } = req.body;
    await prisma.notificacion.update({ where: { id: parseInt(req.params.id) }, data: { mensaje, tipo, usuarioId: parseInt(usuarioId), leida: leida === 'on' } });
  } catch (err) { console.error(err); }
  res.redirect('/admin/notificaciones');
};

const destroy = async (req, res) => {
  try { await prisma.notificacion.delete({ where: { id: parseInt(req.params.id) } }); } catch (err) { console.error(err); }
  res.redirect('/admin/notificaciones');
};

module.exports = { index, create, store, edit, update, destroy };
