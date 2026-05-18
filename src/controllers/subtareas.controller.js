const prisma = require('../prisma');

const getAllSubtareas = async (req, res) => {
  try {
    const subtareas = await prisma.subtarea.findMany({
      include: {
        tarea: { select: { id: true, titulo: true, estado: true } }
      }
    });
    res.json(subtareas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener subtareas' });
  }
};

const getSubtareaById = async (req, res) => {
  try {
    const { id } = req.params;
    const subtarea = await prisma.subtarea.findUnique({
      where: { id: parseInt(id) },
      include: {
        tarea: { select: { id: true, titulo: true, estado: true } }
      }
    });
    if (!subtarea) return res.status(404).json({ error: 'Subtarea no encontrada' });
    res.json(subtarea);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la subtarea' });
  }
};

const createSubtarea = async (req, res) => {
  try {
    const { titulo, completada, tareaId } = req.body;
    const subtarea = await prisma.subtarea.create({
      data: {
        titulo,
        completada: completada ?? false,
        tareaId: parseInt(tareaId)
      }
    });
    res.status(201).json(subtarea);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear subtarea' });
  }
};

const updateSubtarea = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const subtarea = await prisma.subtarea.update({
      where: { id: parseInt(id) },
      data
    });
    res.json(subtarea);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la subtarea' });
  }
};

const deleteSubtarea = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.subtarea.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Subtarea eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar la subtarea' });
  }
};

module.exports = {
  getAllSubtareas,
  getSubtareaById,
  createSubtarea,
  updateSubtarea,
  deleteSubtarea
};
