const prisma = require('../prisma');

// Roles válidos dentro de un proyecto
const ROLES_PROYECTO = ['JEFE_PROYECTO', 'SUPERVISOR', 'TRABAJADOR'];
// Roles con permisos de gestión dentro de un proyecto
const ROLES_GESTION = ['JEFE_EQUIPO', 'JEFE_PROYECTO'];

/* ───────────────────────── helpers de rol ───────────────────────── */

// ¿Es el usuario jefe del equipo dueño del proyecto?
async function esJefeDeEquipo(userId, equipoId) {
  if (!equipoId) return false;
  const mem = await prisma.equipoUsuario.findUnique({
    where: { usuarioId_equipoId: { usuarioId: userId, equipoId } },
  });
  return mem?.estado === 'ACEPTADO' && mem.rol === 'JEFE_EQUIPO';
}

// ¿Pertenece el usuario (aceptado) al equipo dueño del proyecto?
async function esMiembroDeEquipo(userId, equipoId) {
  if (!equipoId) return false;
  const mem = await prisma.equipoUsuario.findUnique({
    where: { usuarioId_equipoId: { usuarioId: userId, equipoId } },
  });
  return mem?.estado === 'ACEPTADO';
}

// Devuelve el rol del usuario en un proyecto: 'JEFE_EQUIPO' si lidera el equipo,
// el rol de ProyectoUsuario si es miembro, o null si no participa.
async function rolEnProyecto(userId, rolId, project) {
  if (rolId === 1) return 'JEFE_EQUIPO'; // admin global
  if (await esJefeDeEquipo(userId, project.equipoId)) return 'JEFE_EQUIPO';
  const pm = await prisma.proyectoUsuario.findUnique({
    where: { proyectoId_usuarioId: { proyectoId: project.id, usuarioId: userId } },
  });
  return pm?.rol ?? null;
}

// ¿Puede el usuario ver/acceder a un proyecto? (admin, jefe de equipo,
// miembro aceptado del equipo, o miembro del proyecto)
async function canAccessProject(userId, rolId, project) {
  if (rolId === 1) return true;
  if (await esMiembroDeEquipo(userId, project.equipoId)) return true;
  const pm = await prisma.proyectoUsuario.findUnique({
    where: { proyectoId_usuarioId: { proyectoId: project.id, usuarioId: userId } },
  });
  return !!pm;
}

/* ───────────────────────── middlewares ───────────────────────── */

// Carga el proyecto de :id, valida acceso y lo deja en req.project.
const requireProjectAccess = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id);
    if (Number.isNaN(projectId)) return res.status(400).json({ error: 'ID de proyecto no válido' });

    const project = await prisma.proyecto.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    const { userId, rolId } = req.user;
    if (!(await canAccessProject(userId, rolId, project))) {
      return res.status(403).json({ error: 'No tienes acceso a este proyecto' });
    }

    req.project = project;
    req.myProjectRole = await rolEnProyecto(userId, rolId, project);
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

    const { userId, rolId } = req.user;
    if (!(await canAccessProject(userId, rolId, project))) {
      return res.status(403).json({ error: 'No tienes acceso a este proyecto' });
    }

    req.project = project;
    req.myProjectRole = await rolEnProyecto(userId, rolId, project);
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

    const { userId, rolId } = req.user;
    if (!(await canAccessProject(userId, rolId, task.proyecto))) {
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

    const { userId, rolId } = req.user;
    if (!(await canAccessProject(userId, rolId, task.proyecto))) {
      return res.status(403).json({ error: 'No tienes acceso a esta tarea' });
    }

    req.task = task;
    req.project = task.proyecto;
    req.myProjectRole = await rolEnProyecto(userId, rolId, task.proyecto);
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al validar el acceso a la tarea' });
  }
};

module.exports = {
  ROLES_PROYECTO,
  ROLES_GESTION,
  esJefeDeEquipo,
  esMiembroDeEquipo,
  rolEnProyecto,
  canAccessProject,
  requireProjectAccess,
  requireBodyProjectAccess,
  requireBodyTaskAccess,
  requireTaskAccess,
};
