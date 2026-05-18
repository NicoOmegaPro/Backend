const prisma = require('../../prisma');

const fmt = (date) => date ? new Date(date).toLocaleDateString('es-ES') : '-';

const index = async (req, res) => {
  const comentarios = await prisma.comentario.findMany({
    include: { autor: { select: { nombre: true } }, tarea: { select: { titulo: true } } },
    orderBy: { fecha: 'desc' }
  });
  res.render('comentarios', { comentarios, title: 'Comentarios', active: 'comentarios', fmt });
};

const destroy = async (req, res) => {
  try { await prisma.comentario.delete({ where: { id: parseInt(req.params.id) } }); } catch (err) { console.error(err); }
  res.redirect('/admin/comentarios');
};

module.exports = { index, destroy };
