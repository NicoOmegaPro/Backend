const prisma = require('../../prisma');
const { getPageParams, buildMeta } = require('../../utils/paginate');

const fmt = (date) => date ? new Date(date).toLocaleDateString('es-ES') : '-';

const index = async (req, res) => {
  const { page, limit, skip } = getPageParams(req);
  const q = (req.query.q || '').trim();
  const where = q ? {
    OR: [
      { nombre: { contains: q, mode: 'insensitive' } },
      { usuario: { nombre: { contains: q, mode: 'insensitive' } } },
      { tarea: { titulo: { contains: q, mode: 'insensitive' } } },
    ],
  } : {};
  const [adjuntos, total] = await Promise.all([
    prisma.adjunto.findMany({
      where,
      include: { tarea: { select: { titulo: true } }, usuario: { select: { nombre: true } } },
      orderBy: { id: 'asc' },
      skip, take: limit,
    }),
    prisma.adjunto.count({ where }),
  ]);
  res.render('adjuntos', { adjuntos, q, title: 'Adjuntos', active: 'adjuntos', fmt, pagination: buildMeta({ page, limit, total }) });
};

async function opciones() {
  const [usuarios, tareas] = await Promise.all([
    prisma.usuario.findMany({ select: { id: true, nombre: true }, orderBy: { nombre: 'asc' } }),
    prisma.tarea.findMany({ select: { id: true, titulo: true }, orderBy: { id: 'asc' } }),
  ]);
  return { usuarios, tareas };
}

const create = async (req, res) => {
  res.render('adjuntos_form', { adjunto: null, ...(await opciones()), title: 'Nuevo Adjunto', active: 'adjuntos' });
};

const store = async (req, res) => {
  try {
    const { nombre, rutaLocal, tareaId, subidoPor } = req.body;
    await prisma.adjunto.create({ data: { nombre, rutaLocal, tareaId: parseInt(tareaId), subidoPor: parseInt(subidoPor) } });
  } catch (err) { console.error(err); }
  res.redirect('/admin/adjuntos');
};

const edit = async (req, res) => {
  const adjunto = await prisma.adjunto.findUnique({ where: { id: parseInt(req.params.id) } });
  res.render('adjuntos_form', { adjunto, ...(await opciones()), title: 'Editar Adjunto', active: 'adjuntos' });
};

const update = async (req, res) => {
  try {
    const { nombre, rutaLocal, tareaId, subidoPor } = req.body;
    await prisma.adjunto.update({ where: { id: parseInt(req.params.id) }, data: { nombre, rutaLocal, tareaId: parseInt(tareaId), subidoPor: parseInt(subidoPor) } });
  } catch (err) { console.error(err); }
  res.redirect('/admin/adjuntos');
};

const destroy = async (req, res) => {
  try { await prisma.adjunto.delete({ where: { id: parseInt(req.params.id) } }); } catch (err) { console.error(err); }
  res.redirect('/admin/adjuntos');
};

module.exports = { index, create, store, edit, update, destroy };
