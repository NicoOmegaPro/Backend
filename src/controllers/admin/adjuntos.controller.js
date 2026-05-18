const prisma = require('../../prisma');

const fmt = (date) => date ? new Date(date).toLocaleDateString('es-ES') : '-';

const index = async (req, res) => {
  const adjuntos = await prisma.adjunto.findMany({
    include: { tarea: { select: { titulo: true } }, usuario: { select: { nombre: true } } },
    orderBy: { fecha: 'desc' }
  });
  res.render('adjuntos', { adjuntos, title: 'Adjuntos', active: 'adjuntos', fmt });
};

const destroy = async (req, res) => {
  try { await prisma.adjunto.delete({ where: { id: parseInt(req.params.id) } }); } catch (err) { console.error(err); }
  res.redirect('/admin/adjuntos');
};

module.exports = { index, destroy };
