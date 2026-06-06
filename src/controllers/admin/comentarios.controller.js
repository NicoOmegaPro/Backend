const prisma = require('../../prisma');
const { getPageParams, buildMeta } = require('../../utils/paginate');

const fmt = (date) => date ? new Date(date).toLocaleDateString('es-ES') : '-';

const index = async (req, res) => {
  const { page, limit, skip } = getPageParams(req);
  const [comentarios, total] = await Promise.all([
    prisma.comentario.findMany({
      include: { autor: { select: { nombre: true } }, tarea: { select: { titulo: true } } },
      orderBy: { fecha: 'desc' },
      skip, take: limit,
    }),
    prisma.comentario.count(),
  ]);
  res.render('comentarios', { comentarios, title: 'Comentarios', active: 'comentarios', fmt, pagination: buildMeta({ page, limit, total }) });
};

const destroy = async (req, res) => {
  try { await prisma.comentario.delete({ where: { id: parseInt(req.params.id) } }); } catch (err) { console.error(err); }
  res.redirect('/admin/comentarios');
};

module.exports = { index, destroy };
