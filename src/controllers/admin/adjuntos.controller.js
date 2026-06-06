const prisma = require('../../prisma');
const { getPageParams, buildMeta } = require('../../utils/paginate');

const fmt = (date) => date ? new Date(date).toLocaleDateString('es-ES') : '-';

const index = async (req, res) => {
  const { page, limit, skip } = getPageParams(req);
  const [adjuntos, total] = await Promise.all([
    prisma.adjunto.findMany({
      include: { tarea: { select: { titulo: true } }, usuario: { select: { nombre: true } } },
      orderBy: { fecha: 'desc' },
      skip, take: limit,
    }),
    prisma.adjunto.count(),
  ]);
  res.render('adjuntos', { adjuntos, title: 'Adjuntos', active: 'adjuntos', fmt, pagination: buildMeta({ page, limit, total }) });
};

const destroy = async (req, res) => {
  try { await prisma.adjunto.delete({ where: { id: parseInt(req.params.id) } }); } catch (err) { console.error(err); }
  res.redirect('/admin/adjuntos');
};

module.exports = { index, destroy };
