const prisma = require('../prisma');

const getAllProjects = async (req, res) => {
  try {
    const projects = await prisma.proyecto.findMany({
      include: {
        lider: { select: { id: true, nombre: true } },
        equipo: true
      }
    });
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener proyectos' });
  }
};

const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await prisma.proyecto.findUnique({
      where: { id: parseInt(id) },
      include: {
        lider: { select: { id: true, nombre: true } },
        equipo: true,
        tareas: true
      }
    });
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el proyecto' });
  }
};

const createProject = async (req, res) => {
  try {
    const { nombre, descripcion, liderId, equipoId } = req.body;
    const project = await prisma.proyecto.create({
      data: {
        nombre,
        descripcion,
        liderId: liderId ? parseInt(liderId) : null,
        equipoId: equipoId ? parseInt(equipoId) : null
      }
    });
    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear proyecto' });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const project = await prisma.proyecto.update({
      where: { id: parseInt(id) },
      data
    });
    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar proyecto' });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.proyecto.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Proyecto eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar proyecto' });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
};
