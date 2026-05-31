const prisma = require('../prisma');
const { registrarActividad } = require('../utils/registrarActividad');

const getAllSprints = async (req, res) => {
  try {
    const sprints = await prisma.sprint.findMany({
      include: {
        proyecto: { select: { id: true, nombre: true, estado: true } },
        tareas: true
      }
    });
    res.json(sprints);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener sprints' });
  }
};

const getSprintById = async (req, res) => {
  try {
    const { id } = req.params;
    const sprint = await prisma.sprint.findUnique({
      where: { id: parseInt(id) },
      include: {
        proyecto: { select: { id: true, nombre: true, estado: true } },
        tareas: true
      }
    });
    if (!sprint) return res.status(404).json({ error: 'Sprint no encontrado' });
    res.json(sprint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el sprint' });
  }
};

const createSprint = async (req, res) => {
  try {
    const { nombre, fechaInicio, fechaFin, proyectoId } = req.body;
    const sprint = await prisma.sprint.create({
      data: {
        nombre,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        proyectoId: parseInt(proyectoId)
      }
    });

    await registrarActividad({
      usuarioId: req.user.userId,
      entidadTipo: 'SPRINT',
      entidadId: sprint.id,
      accion: 'CREADO',
      detalles: `creó el sprint «${sprint.nombre}»`,
    });

    res.status(201).json(sprint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear sprint' });
  }
};

const updateSprint = async (req, res) => {
  try {
    const { id } = req.params;
    const { fechaInicio, fechaFin, ...data } = req.body;
    const updateData = {
      ...data,
      ...(fechaInicio ? { fechaInicio: new Date(fechaInicio) } : {}),
      ...(fechaFin ? { fechaFin: new Date(fechaFin) } : {})
    };
    const sprint = await prisma.sprint.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    res.json(sprint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el sprint' });
  }
};

const deleteSprint = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.sprint.delete({ where: { id: parseInt(id) } });
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
  deleteSprint
};
