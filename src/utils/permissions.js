const prisma = require('../prisma');

const ROLES_EQUIPO = ['JEFE_EQUIPO', 'SUPERVISOR', 'MIEMBRO'];
const ROLES_GESTION = ['JEFE_EQUIPO', 'SUPERVISOR'];


async function rolEnEquipo(userId, esAdmin, equipoId) {
  if (esAdmin) return 'JEFE_EQUIPO';
  if (!equipoId) return null;
  const mem = await prisma.equipoUsuario.findUnique({
    where: { usuarioId_equipoId: { usuarioId: userId, equipoId } },
  });
  return mem?.estado === 'ACEPTADO' ? mem.rol : null;
}

async function esJefeDeEquipo(userId, equipoId) {
  if (!equipoId) return false;
  const mem = await prisma.equipoUsuario.findUnique({
    where: { usuarioId_equipoId: { usuarioId: userId, equipoId } },
  });
  return mem?.estado === 'ACEPTADO' && mem.rol === 'JEFE_EQUIPO';
}

async function esMiembroDeEquipo(userId, equipoId) {
  if (!equipoId) return false;
  const mem = await prisma.equipoUsuario.findUnique({
    where: { usuarioId_equipoId: { usuarioId: userId, equipoId } },
  });
  return mem?.estado === 'ACEPTADO';
}

// El usuario pertenece al proyecto si es miembro ACEPTADO de cualquiera de sus
// equipos (el dueño o cualquier equipo invitado).
async function esMiembroDeProyecto(userId, projectId) {
  if (!projectId) return false;
  const count = await prisma.proyectoEquipo.count({
    where: {
      proyectoId: projectId,
      equipo: { usuarios: { some: { usuarioId: userId, estado: 'ACEPTADO' } } },
    },
  });
  return count > 0;
}

// Rol del usuario dentro del proyecto. Solo el equipo dueño gestiona: sus miembros
// conservan su rol de equipo; los miembros de equipos invitados son TRABAJADORES (MIEMBRO).
async function rolEnProyecto(userId, esAdmin, project) {
  if (esAdmin) return 'JEFE_EQUIPO';
  if (!project) return null;
  const rolDueno = await rolEnEquipo(userId, false, project.equipoId);
  if (rolDueno) return rolDueno;
  if (await esMiembroDeProyecto(userId, project.id)) return 'MIEMBRO';
  return null;
}

async function canAccessProject(userId, esAdmin, project) {
  if (esAdmin) return true;
  return esMiembroDeProyecto(userId, project.id);
}


const requireProjectAccess = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id);
    if (Number.isNaN(projectId)) return res.status(400).json({ error: 'ID de proyecto no válido' });

    const project = await prisma.proyecto.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    const { userId, esAdmin } = req.user;
    if (!(await canAccessProject(userId, esAdmin, project))) {
      return res.status(403).json({ error: 'No tienes acceso a este proyecto' });
    }

    req.project = project;
    req.myProjectRole = await rolEnProyecto(userId, esAdmin, project);
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al validar el acceso al proyecto' });
  }
};

const requireBodyProjectAccess = (campo = 'proyectoId') => async (req, res, next) => {
  try {
    const projectId = parseInt(req.body[campo]);
    if (Number.isNaN(projectId)) return res.status(400).json({ error: 'Debes indicar un proyecto válido' });

    const project = await prisma.proyecto.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    const { userId, esAdmin } = req.user;
    if (!(await canAccessProject(userId, esAdmin, project))) {
      return res.status(403).json({ error: 'No tienes acceso a este proyecto' });
    }

    req.project = project;
    req.myProjectRole = await rolEnProyecto(userId, esAdmin, project);
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al validar el acceso al proyecto' });
  }
};

const requireBodyTaskAccess = (campo = 'tareaId') => async (req, res, next) => {
  try {
    const taskId = parseInt(req.body[campo]);
    if (Number.isNaN(taskId)) return res.status(400).json({ error: 'Debes indicar una tarea válida' });

    const task = await prisma.tarea.findUnique({
      where: { id: taskId },
      include: { proyecto: true },
    });
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });

    const { userId, esAdmin } = req.user;
    if (!(await canAccessProject(userId, esAdmin, task.proyecto))) {
      return res.status(403).json({ error: 'No tienes acceso a esta tarea' });
    }

    req.task = task;
    req.project = task.proyecto;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al validar el acceso a la tarea' });
  }
};

const requireTaskAccess = async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id);
    if (Number.isNaN(taskId)) return res.status(400).json({ error: 'ID de tarea no válido' });

    const task = await prisma.tarea.findUnique({
      where: { id: taskId },
      include: { proyecto: true },
    });
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });

    const { userId, esAdmin } = req.user;
    if (!(await canAccessProject(userId, esAdmin, task.proyecto))) {
      return res.status(403).json({ error: 'No tienes acceso a esta tarea' });
    }

    req.task = task;
    req.project = task.proyecto;
    req.myProjectRole = await rolEnProyecto(userId, esAdmin, task.proyecto);
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al validar el acceso a la tarea' });
  }
};

module.exports = {
  ROLES_EQUIPO,
  ROLES_GESTION,
  rolEnEquipo,
  esJefeDeEquipo,
  esMiembroDeEquipo,
  esMiembroDeProyecto,
  rolEnProyecto,
  canAccessProject,
  requireProjectAccess,
  requireBodyProjectAccess,
  requireBodyTaskAccess,
  requireTaskAccess,
};
