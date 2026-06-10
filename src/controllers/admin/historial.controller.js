const prisma = require('../../prisma');
const { getPageParams, buildMeta } = require('../../utils/paginate');

const fmt = (date) => date ? new Date(date).toLocaleDateString('es-ES') : '-';

const index = async (req, res) => {
  const { page, limit, skip } = getPageParams(req, { defaultLimit: 30 });
  const q = (req.query.q || '').trim();
  const where = q ? {
    OR: [
      { accion: { contains: q, mode: 'insensitive' } },
      { detalles: { contains: q, mode: 'insensitive' } },
      { entidadTipo: { contains: q, mode: 'insensitive' } },
      { usuario: { nombre: { contains: q, mode: 'insensitive' } } },
    ],
  } : {};
  const [historial, total] = await Promise.all([
    prisma.historialActividad.findMany({
      where,
      include: { usuario: { select: { nombre: true } } },
      orderBy: { id: 'asc' },
      skip, take: limit,
    }),
    prisma.historialActividad.count({ where }),
  ]);
  res.render('historial', { historial, q, title: 'Historial', active: 'historial', fmt, pagination: buildMeta({ page, limit, total }) });
};

async function usuarios() {
  return prisma.usuario.findMany({ select: { id: true, nombre: true }, orderBy: { nombre: 'asc' } });
}

const create = async (req, res) => {
  res.render('historial_form', { registro: null, usuarios: await usuarios(), title: 'Nuevo Registro', active: 'historial' });
};

const store = async (req, res) => {
  try {
    const { entidadTipo, entidadId, accion, detalles, usuarioId } = req.body;
    await prisma.historialActividad.create({
      data: { entidadTipo, entidadId: parseInt(entidadId), accion, detalles: detalles || null, usuarioId: parseInt(usuarioId) },
    });
  } catch (err) { console.error(err); }
  res.redirect('/admin/historial');
};

const edit = async (req, res) => {
  const registro = await prisma.historialActividad.findUnique({ where: { id: parseInt(req.params.id) } });
  res.render('historial_form', { registro, usuarios: await usuarios(), title: 'Editar Registro', active: 'historial' });
};

const update = async (req, res) => {
  try {
    const { entidadTipo, entidadId, accion, detalles, usuarioId } = req.body;
    await prisma.historialActividad.update({
      where: { id: parseInt(req.params.id) },
      data: { entidadTipo, entidadId: parseInt(entidadId), accion, detalles: detalles || null, usuarioId: parseInt(usuarioId) },
    });
  } catch (err) { console.error(err); }
  res.redirect('/admin/historial');
};

const destroy = async (req, res) => {
  try { await prisma.historialActividad.delete({ where: { id: parseInt(req.params.id) } }); } catch (err) { console.error(err); }
  res.redirect('/admin/historial');
};

module.exports = { index, create, store, edit, update, destroy };
