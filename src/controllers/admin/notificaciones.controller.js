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

const destroy = async (req, res) => {
  try { await prisma.notificacion.delete({ where: { id: parseInt(req.params.id) } }); } catch (err) { console.error(err); }
  res.redirect('/admin/notificaciones');
};

module.exports = { index, destroy };
