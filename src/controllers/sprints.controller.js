const prisma = require('../prisma');
const { registrarActividad } = require('../utils/registrarActividad');
const { canAccessProject, rolEnProyecto, ROLES_GESTION } = require('../utils/permissions');

const getAllSprints = async (req, res) => {
  try {
    const { proyectoId } = req.query;
    if (!proyectoId) return res.status(400).json({ error: 'Falta el parámetro proyectoId' });

    const project = await prisma.proyecto.findUnique({ where: { id: parseInt(proyectoId) } });
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    const { userId, esAdmin } = req.user;
    if (!(await canAccessProject(userId, esAdmin, project))) {
      return res.status(403).json({ error: 'No tienes acceso a este proyecto' });
    }

    const sprints = await prisma.sprint.findMany({
      where: { proyectoId: project.id },
      orderBy: { fechaInicio: 'desc' },
      include: { tareas: { select: { id: true, estado: true } } },
    });
    res.json(sprints);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener sprints' });
  }
};

const getSprintById = async (req, res) => {
  try {
    const sprint = await prisma.sprint.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { proyecto: true, tareas: true },
    });
    if (!sprint) return res.status(404).json({ error: 'Sprint no encontrado' });

    const { userId, esAdmin } = req.user;
    if (!(await canAccessProject(userId, esAdmin, sprint.proyecto))) {
      return res.status(403).json({ error: 'No tienes acceso a este sprint' });
    }
    res.json(sprint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el sprint' });
  }
};

const createSprint = async (req, res) => {
  try {
    if (!ROLES_GESTION.includes(req.myProjectRole)) {
      return res.status(403).json({ error: 'Solo los jefes pueden crear sprints' });
    }
    const { nombre, objetivo, estado, fechaInicio, fechaFin } = req.body;

    const sprint = await prisma.sprint.create({
      data: {
        nombre,
        objetivo: objetivo ?? null,
        estado: estado ?? 'PLANIFICADO',
        fechaInicio,
        fechaFin,
        proyectoId: req.project.id,
      },
    });

    await registrarActividad({
      usuarioId: req.user.userId, entidadTipo: 'SPRINT', entidadId: sprint.id,
      accion: 'CREADO', detalles: `creó el sprint «${sprint.nombre}»`,
    });

    res.status(201).json(sprint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear sprint' });
  }
};

async function loadSprintGestion(req, res) {
  const sprint = await prisma.sprint.findUnique({
    where: { id: parseInt(req.params.id) },
    include: { proyecto: true },
  });
  if (!sprint) {
    res.status(404).json({ error: 'Sprint no encontrado' });
    return null;
  }
  const { userId, esAdmin } = req.user;
  const miRol = await rolEnProyecto(userId, esAdmin, sprint.proyecto);
  if (!ROLES_GESTION.includes(miRol)) {
    res.status(403).json({ error: 'Solo los jefes pueden modificar sprints' });
    return null;
  }
  return sprint;
}

const updateSprint = async (req, res) => {
  try {
    const sprint = await loadSprintGestion(req, res);
    if (!sprint) return;

    const { nombre, objetivo, estado, fechaInicio, fechaFin } = req.body;
    const data = {};
    if (nombre !== undefined) data.nombre = nombre;
    if (objetivo !== undefined) data.objetivo = objetivo;
    if (estado !== undefined) data.estado = estado;
    if (fechaInicio) data.fechaInicio = fechaInicio;
    if (fechaFin) data.fechaFin = fechaFin;

    const updated = await prisma.sprint.update({ where: { id: sprint.id }, data });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el sprint' });
  }
};

const deleteSprint = async (req, res) => {
  try {
    const sprint = await loadSprintGestion(req, res);
    if (!sprint) return;
    await prisma.sprint.delete({ where: { id: sprint.id } });
    res.json({ message: 'Sprint eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el sprint' });
  }
};

module.exports = {
  getAllSprints,
  getSprintById,
  createSprint,
  updateSprint,
  deleteSprint,
};
