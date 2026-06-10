const prisma = require('../../prisma');
const { getPageParams, buildMeta } = require('../../utils/paginate');

const fmt = (date) => date ? new Date(date).toLocaleDateString('es-ES') : '-';

const index = async (req, res) => {
  const { page, limit, skip } = getPageParams(req);
  const q = (req.query.q || '').trim();
  const where = q ? {
    OR: [
      { contenido: { contains: q, mode: 'insensitive' } },
      { autor: { nombre: { contains: q, mode: 'insensitive' } } },
      { tarea: { titulo: { contains: q, mode: 'insensitive' } } },
    ],
  } : {};
  const [comentarios, total] = await Promise.all([
    prisma.comentario.findMany({
      where,
      include: { autor: { select: { nombre: true } }, tarea: { select: { titulo: true } } },
      orderBy: { id: 'asc' },
      skip, take: limit,
    }),
    prisma.comentario.count({ where }),
  ]);
  res.render('comentarios', { comentarios, q, title: 'Comentarios', active: 'comentarios', fmt, pagination: buildMeta({ page, limit, total }) });
};

async function opciones() {
  const [usuarios, tareas] = await Promise.all([
    prisma.usuario.findMany({ select: { id: true, nombre: true }, orderBy: { nombre: 'asc' } }),
    prisma.tarea.findMany({ select: { id: true, titulo: true }, orderBy: { id: 'asc' } }),
  ]);
  return { usuarios, tareas };
}

const create = async (req, res) => {
  res.render('comentarios_form', { comentario: null, ...(await opciones()), title: 'Nuevo Comentario', active: 'comentarios' });
};

const store = async (req, res) => {
  try {
    const { contenido, tareaId, autorId } = req.body;
    await prisma.comentario.create({ data: { contenido, tareaId: parseInt(tareaId), autorId: parseInt(autorId) } });
  } catch (err) { console.error(err); }
  res.redirect('/admin/comentarios');
};

const edit = async (req, res) => {
  const comentario = await prisma.comentario.findUnique({ where: { id: parseInt(req.params.id) } });
  res.render('comentarios_form', { comentario, ...(await opciones()), title: 'Editar Comentario', active: 'comentarios' });
};

const update = async (req, res) => {
  try {
    const { contenido, tareaId, autorId } = req.body;
    await prisma.comentario.update({ where: { id: parseInt(req.params.id) }, data: { contenido, tareaId: parseInt(tareaId), autorId: parseInt(autorId) } });
  } catch (err) { console.error(err); }
  res.redirect('/admin/comentarios');
};

const destroy = async (req, res) => {
  try { await prisma.comentario.delete({ where: { id: parseInt(req.params.id) } }); } catch (err) { console.error(err); }
  res.redirect('/admin/comentarios');
};

module.exports = { index, create, store, edit, update, destroy };
