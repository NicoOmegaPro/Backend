const prisma = require('../prisma');

const getAllEquipos = async (req, res) => {
  try {
    const equipos = await prisma.equipo.findMany({
      include: {
        usuarios: {
          include: {
            usuario: {
              select: { id: true, nombre: true, email: true }
            }
          }
        },
        proyectos: true
      }
    });
    res.json(equipos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener equipos' });
  }
};

const getEquipoById = async (req, res) => {
  try {
    const { id } = req.params;
    const equipo = await prisma.equipo.findUnique({
      where: { id: parseInt(id) },
      include: {
        usuarios: {
          include: {
            usuario: {
              select: { id: true, nombre: true, email: true }
            }
          }
        },
        proyectos: true
      }
    });
    if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' });
    res.json(equipo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el equipo' });
  }
};

const createEquipo = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    const equipo = await prisma.equipo.create({
      data: { nombre, descripcion }
    });
    res.status(201).json(equipo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear equipo' });
  }
};

const updateEquipo = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const equipo = await prisma.equipo.update({
      where: { id: parseInt(id) },
      data
    });
    res.json(equipo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el equipo' });
  }
};

const deleteEquipo = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.equipo.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Equipo eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el equipo' });
  }
};

module.exports = {
  getAllEquipos,
  getEquipoById,
  createEquipo,
  updateEquipo,
  deleteEquipo
};
