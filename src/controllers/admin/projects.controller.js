const prisma = require('../../prisma');

const index = async (req, res) => {
  const projects = await prisma.proyecto.findMany({
    include: { equipo: { select: { nombre: true } }, lider: { select: { nombre: true } } },
    orderBy: { id: 'asc' }
  });
  res.render('projects', { projects, title: 'Proyectos', active: 'projects' });
};

const create = async (req, res) => {
  const [equipos, users] = await Promise.all([
    prisma.equipo.findMany({ select: { id: true, nombre: true } }),
    prisma.usuario.findMany({ select: { id: true, nombre: true } })
  ]);
  res.render('projects_form', { project: null, equipos, users, title: 'Nuevo Proyecto', active: 'projects' });
};

const store = async (req, res) => {
  try {
    const { nombre, descripcion, estado, equipoId, liderId } = req.body;
    await prisma.proyecto.create({
      data: {
        nombre, descripcion,
        estado: estado || 'ACTIVO',
        equipoId: equipoId ? parseInt(equipoId) : null,
        liderId: liderId ? parseInt(liderId) : null
      }
    });
  } catch (err) { console.error(err); }
  res.redirect('/admin/projects');
};

const edit = async (req, res) => {
  const [project, equipos, users] = await Promise.all([
    prisma.proyecto.findUnique({ where: { id: parseInt(req.params.id) } }),
    prisma.equipo.findMany({ select: { id: true, nombre: true } }),
    prisma.usuario.findMany({ select: { id: true, nombre: true } })
  ]);
  res.render('projects_form', { project, equipos, users, title: 'Editar Proyecto', active: 'projects' });
};

const update = async (req, res) => {
  try {
    const { nombre, descripcion, estado, equipoId, liderId } = req.body;
    await prisma.proyecto.update({
      where: { id: parseInt(req.params.id) },
      data: {
        nombre, descripcion, estado,
        equipoId: equipoId ? parseInt(equipoId) : null,
        liderId: liderId ? parseInt(liderId) : null
      }
    });
  } catch (err) { console.error(err); }
  res.redirect('/admin/projects');
};

const destroy = async (req, res) => {
  try { await prisma.proyecto.delete({ where: { id: parseInt(req.params.id) } }); } catch (err) { console.error(err); }
  res.redirect('/admin/projects');
};

module.exports = { index, create, store, edit, update, destroy };
