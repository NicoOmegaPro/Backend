const prisma = require('../prisma');

const getAllEtiquetas = async (req, res) => {
  try {
    const etiquetas = await prisma.etiqueta.findMany({
      include: {
        tareas: {
          include: {
            tarea: { select: { id: true, titulo: true, estado: true } }
          }
        }
      }
    });
    res.json(etiquetas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener etiquetas' });
  }
};

const getEtiquetaById = async (req, res) => {
  try {
    const { id } = req.params;
    const etiqueta = await prisma.etiqueta.findUnique({
      where: { id: parseInt(id) },
      include: {
        tareas: {
          include: {
            tarea: { select: { id: true, titulo: true, estado: true } }
          }
        }
      }
    });
    if (!etiqueta) return res.status(404).json({ error: 'Etiqueta no encontrada' });
    res.json(etiqueta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la etiqueta' });
  }
};

const createEtiqueta = async (req, res) => {
  try {
    const { nombre, color } = req.body;
    const etiqueta = await prisma.etiqueta.create({
      data: { nombre, color }
    });
    res.status(201).json(etiqueta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear etiqueta' });
  }
};

const updateEtiqueta = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const etiqueta = await prisma.etiqueta.update({
      where: { id: parseInt(id) },
      data
    });
    res.json(etiqueta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la etiqueta' });
  }
};

const deleteEtiqueta = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.etiqueta.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Etiqueta eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar la etiqueta' });
  }
};

module.exports = {
  getAllEtiquetas,
  getEtiquetaById,
  createEtiqueta,
  updateEtiqueta,
  deleteEtiqueta
};
