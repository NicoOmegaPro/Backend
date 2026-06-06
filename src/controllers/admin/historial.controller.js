const prisma = require('../../prisma');
const { getPageParams, buildMeta } = require('../../utils/paginate');

const fmt = (date) => date ? new Date(date).toLocaleDateString('es-ES') : '-';

const index = async (req, res) => {
  const { page, limit, skip } = getPageParams(req, { defaultLimit: 30 });
  const [historial, total] = await Promise.all([
    prisma.historialActividad.findMany({
      include: { usuario: { select: { nombre: true } } },
      orderBy: { fecha: 'desc' },
      skip, take: limit,
    }),
    prisma.historialActividad.count(),
  ]);
  res.render('historial', { historial, title: 'Historial', active: 'historial', fmt, pagination: buildMeta({ page, limit, total }) });
};

module.exports = { index };
