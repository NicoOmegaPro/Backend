const prisma = require('../../prisma');

const fmt = (date) => date ? new Date(date).toLocaleDateString('es-ES') : '-';

const index = async (req, res) => {
  const historial = await prisma.historialActividad.findMany({
    include: { usuario: { select: { nombre: true } } },
    orderBy: { fecha: 'desc' }
  });
  res.render('historial', { historial, title: 'Historial', active: 'historial', fmt });
};

module.exports = { index };
