const prisma = require('../../prisma');
const { getPageParams, buildMeta } = require('../../utils/paginate');

// Normaliza el valor de los checkboxes (puede llegar como array, string o undefined).
function normalizarIds(v) {
  const arr = Array.isArray(v) ? v : v ? [v] : [];
  return arr.map((x) => parseInt(x)).filter((n) => !Number.isNaN(n));
}

// Equipos del proyecto = el dueño + los colaboradores marcados (sin duplicados).
function equiposDelFormulario(body) {
  const ownerId = body.equipoId ? parseInt(body.equipoId) : null;
  const colaboradores = normalizarIds(body.equiposColaboradores);
  return [...new Set([...(ownerId ? [ownerId] : []), ...colaboradores])];
}

const index = async (req, res) => {
  const { page, limit, skip } = getPageParams(req);
  const q = (req.query.q || '').trim();
  const where = q ? {
    OR: [
      { nombre: { contains: q, mode: 'insensitive' } },
      { descripcion: { contains: q, mode: 'insensitive' } },
      { equipo: { nombre: { contains: q, mode: 'insensitive' } } },
      { lider: { nombre: { contains: q, mode: 'insensitive' } } },
    ],
  } : {};
  const [projects, total] = await Promise.all([
    prisma.proyecto.findMany({
      where,
      include: {
        equipo: { select: { nombre: true } },
        lider: { select: { nombre: true } },
        _count: { select: { tareas: true } },
      },
      orderBy: { id: 'asc' },
      skip, take: limit,
    }),
    prisma.proyecto.count({ where }),
  ]);
  res.render('projects', { projects, q, title: 'Proyectos', active: 'projects', pagination: buildMeta({ page, limit, total }) });
};

const create = async (req, res) => {
  const [equipos, users] = await Promise.all([
    prisma.equipo.findMany({ select: { id: true, nombre: true } }),
    prisma.usuario.findMany({ select: { id: true, nombre: true } })
  ]);
  res.render('projects_form', { project: null, equipos, users, vinculados: [], title: 'Nuevo Proyecto', active: 'projects' });
};

const store = async (req, res) => {
  try {
    const { nombre, descripcion, estado, equipoId, liderId } = req.body;
    const ownerId = equipoId ? parseInt(equipoId) : null;
    const equiposIds = equiposDelFormulario(req.body);
    await prisma.proyecto.create({
      data: {
        nombre, descripcion,
        estado: estado || 'ACTIVO',
        equipoId: ownerId,
        liderId: liderId ? parseInt(liderId) : null,
        equipos: { create: equiposIds.map((id) => ({ equipoId: id })) }
      }
    });
  } catch (err) { console.error(err); }
  res.redirect('/admin/projects');
};

const edit = async (req, res) => {
  const [project, equipos, users] = await Promise.all([
    prisma.proyecto.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { equipos: { select: { equipoId: true } } },
    }),
    prisma.equipo.findMany({ select: { id: true, nombre: true } }),
    prisma.usuario.findMany({ select: { id: true, nombre: true } })
  ]);
  const vinculados = project ? project.equipos.map((e) => e.equipoId) : [];
  res.render('projects_form', { project, equipos, users, vinculados, title: 'Editar Proyecto', active: 'projects' });
};

const update = async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const { nombre, descripcion, estado, equipoId, liderId } = req.body;
    const ownerId = equipoId ? parseInt(equipoId) : null;
    const equiposIds = equiposDelFormulario(req.body);
    await prisma.proyecto.update({
      where: { id: projectId },
      data: {
        nombre, descripcion, estado,
        equipoId: ownerId,
        liderId: liderId ? parseInt(liderId) : null
      }
    });
    // Sincroniza los equipos del proyecto con lo marcado en el formulario.
    await prisma.proyectoEquipo.deleteMany({ where: { proyectoId: projectId } });
    if (equiposIds.length) {
      await prisma.proyectoEquipo.createMany({
        data: equiposIds.map((id) => ({ proyectoId: projectId, equipoId: id })),
        skipDuplicates: true,
      });
    }
  } catch (err) { console.error(err); }
  res.redirect('/admin/projects');
};

const destroy = async (req, res) => {
  try { await prisma.proyecto.delete({ where: { id: parseInt(req.params.id) } }); } catch (err) { console.error(err); }
  res.redirect('/admin/projects');
};

module.exports = { index, create, store, edit, update, destroy };
