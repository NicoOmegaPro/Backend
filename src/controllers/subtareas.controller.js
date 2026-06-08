const prisma = require('../prisma');
const { canAccessProject } = require('../utils/permissions');

async function loadSubtareaConAcceso(req, res) {
  const subtarea = await prisma.subtarea.findUnique({
    where: { id: parseInt(req.params.id) },
    include: { tarea: { include: { proyecto: true } } },
  });
  if (!subtarea) {
    res.status(404).json({ error: 'Subtarea no encontrada' });
    return null;
  }
  const { userId, esAdmin } = req.user;
  if (!(await canAccessProject(userId, esAdmin, subtarea.tarea.proyecto))) {
    res.status(403).json({ error: 'No tienes acceso a esta subtarea' });
    return null;
  }
  return subtarea;
}

const getAllSubtareas = async (req, res) => {
  try {
    const { tareaId } = req.query;
    if (!tareaId) return res.status(400).json({ error: 'Falta el parámetro tareaId' });

    const subtareas = await prisma.subtarea.findMany({
      where: { tareaId: parseInt(tareaId) },
      orderBy: { id: 'asc' },
    });
    res.json(subtareas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener subtareas' });
  }
};

const getSubtareaById = async (req, res) => {
  try {
    const subtarea = await loadSubtareaConAcceso(req, res);
    if (!subtarea) return;
    res.json(subtarea);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la subtarea' });
  }
};

const createSubtarea = async (req, res) => {
  try {
    const { titulo, completada } = req.body;
    const subtarea = await prisma.subtarea.create({
      data: { titulo, completada: completada ?? false, tareaId: req.task.id },
    });
    res.status(201).json(subtarea);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear subtarea' });
  }
};

const updateSubtarea = async (req, res) => {
  try {
    const existing = await loadSubtareaConAcceso(req, res);
    if (!existing) return;

    const { titulo, completada } = req.body;
    const data = {};
    if (titulo !== undefined) data.titulo = titulo;
    if (completada !== undefined) data.completada = completada;

    const subtarea = await prisma.subtarea.update({ where: { id: existing.id }, data });
    res.json(subtarea);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la subtarea' });
  }
};

const deleteSubtarea = async (req, res) => {
  try {
    const existing = await loadSubtareaConAcceso(req, res);
    if (!existing) return;
    await prisma.subtarea.delete({ where: { id: existing.id } });
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
  deleteSubtarea,
};
