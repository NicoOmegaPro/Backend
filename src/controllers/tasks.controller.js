const prisma = require('../prisma');

const getAllTasks = async (req, res) => {
  try {
    const tasks = await prisma.tarea.findMany({
      include: {
        proyecto: { select: { nombre: true } },
        asignadoA: { select: { nombre: true, email: true } }
      }
    });
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
};

const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await prisma.tarea.findUnique({
      where: { id: parseInt(id) },
      include: {
        proyecto: true,
        asignadoA: { select: { nombre: true, email: true } },
        subtareas: true,
        comentarios: true
      }
    });
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });
    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la tarea' });
  }
};

const createTask = async (req, res) => {
  try {
    const { titulo, descripcion, estado, prioridad, proyectoId, asignadoAId } = req.body;
    const task = await prisma.tarea.create({
      data: {
        titulo,
        descripcion,
        estado: estado || 'PENDIENTE',
        prioridad: prioridad || 'MEDIA',
        proyectoId: parseInt(proyectoId),
        asignadoAId: asignadoAId ? parseInt(asignadoAId) : null
      }
    });
    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear tarea' });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const task = await prisma.tarea.update({
      where: { id: parseInt(id) },
      data
    });
    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar tarea' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.tarea.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Tarea eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar tarea' });
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
};
