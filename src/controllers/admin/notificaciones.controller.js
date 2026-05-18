const prisma = require('../../prisma');

const fmt = (date) => date ? new Date(date).toLocaleDateString('es-ES') : '-';

const index = async (req, res) => {
  const notificaciones = await prisma.notificacion.findMany({
    include: { usuario: { select: { nombre: true } } },
    orderBy: { fecha: 'desc' }
  });
  res.render('notificaciones', { notificaciones, title: 'Notificaciones', active: 'notificaciones', fmt });
};

const destroy = async (req, res) => {
  try { await prisma.notificacion.delete({ where: { id: parseInt(req.params.id) } }); } catch (err) { console.error(err); }
  res.redirect('/admin/notificaciones');
};

module.exports = { index, destroy };
