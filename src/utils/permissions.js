const prisma = require('../prisma');

// Roles de equipo: único nivel de rol además del admin global (booleano).
const ROLES_EQUIPO = ['JEFE_EQUIPO', 'SUPERVISOR', 'MIEMBRO'];
// Roles con permisos de gestión (finalizar/eliminar tareas, etiquetas, etc.).
const ROLES_GESTION = ['JEFE_EQUIPO', 'SUPERVISOR'];

/* ───────────────────────── helpers de rol ───────────────────────── */

// Rol del usuario dentro de un equipo (o null si no es miembro aceptado).
// El admin global actúa como JEFE_EQUIPO en cualquier equipo.
async function rolEnEquipo(userId, esAdmin, equipoId) {
  if (esAdmin) return 'JEFE_EQUIPO';
  if (!equipoId) return null;
  const mem = await prisma.equipoUsuario.findUnique({
    where: { usuarioId_equipoId: { usuarioId: userId, equipoId } },
  });
  return mem?.estado === 'ACEPTADO' ? mem.rol : null;
}

// ¿Es el usuario jefe del equipo dueño del proyecto?
async function esJefeDeEquipo(userId, equipoId) {
  if (!equipoId) return false;
  const mem = await prisma.equipoUsuario.findUnique({
    where: { usuarioId_equipoId: { usuarioId: userId, equipoId } },
  });
  return mem?.estado === 'ACEPTADO' && mem.rol === 'JEFE_EQUIPO';
}

// ¿Pertenece el usuario (aceptado) al equipo?
async function esMiembroDeEquipo(userId, equipoId) {
  if (!equipoId) return false;
  const mem = await prisma.equipoUsuario.findUnique({
    where: { usuarioId_equipoId: { usuarioId: userId, equipoId } },
  });
  return mem?.estado === 'ACEPTADO';
}

// El rol en un proyecto = el rol del usuario en el equipo dueño del proyecto.
async function rolEnProyecto(userId, esAdmin, project) {
  return rolEnEquipo(userId, esAdmin, project?.equipoId);
}

// ¿Puede el usuario ver/acceder a un proyecto? (admin o miembro aceptado del equipo)
async function canAccessProject(userId, esAdmin, project) {
  if (esAdmin) return true;
  return esMiembroDeEquipo(userId, project.equipoId);
}

/* ───────────────────────── middlewares ───────────────────────── */

// Carga el proyecto de :id, valida acceso y lo deja en req.project.
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

// Como requireProjectAccess pero leyendo el id del proyecto del body (para crear recursos).
// Campo configurable: por defecto 'proyectoId'.
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

// Valida acceso a la tarea referida por req.body.tareaId (para subtareas/comentarios/adjuntos).
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

// Carga la tarea de :id (con su proyecto), valida acceso y deja req.task / req.project.
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
  rolEnProyecto,
  canAccessProject,
  requireProjectAccess,
  requireBodyProjectAccess,
  requireBodyTaskAccess,
  requireTaskAccess,
};
