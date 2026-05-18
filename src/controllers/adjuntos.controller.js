const prisma = require('../prisma');

const getAllAdjuntos = async (req, res) => {
  try {
    const adjuntos = await prisma.adjunto.findMany({
      include: {
        tarea: { select: { id: true, titulo: true } },
        usuario: { select: { id: true, nombre: true, email: true } }
      }
    });
    res.json(adjuntos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener adjuntos' });
  }
};

const getAdjuntoById = async (req, res) => {
  try {
    const { id } = req.params;
    const adjunto = await prisma.adjunto.findUnique({
      where: { id: parseInt(id) },
      include: {
        tarea: { select: { id: true, titulo: true } },
        usuario: { select: { id: true, nombre: true, email: true } }
      }
    });
    if (!adjunto) return res.status(404).json({ error: 'Adjunto no encontrado' });
    res.json(adjunto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el adjunto' });
  }
};

const createAdjunto = async (req, res) => {
  try {
    const { rutaLocal, nombre, tareaId, subidoPor } = req.body;
    const adjunto = await prisma.adjunto.create({
      data: {
        rutaLocal,
        nombre,
        tareaId: parseInt(tareaId),
        subidoPor: parseInt(subidoPor)
      }
    });
    res.status(201).json(adjunto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear adjunto' });
  }
};

const updateAdjunto = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const adjunto = await prisma.adjunto.update({
      where: { id: parseInt(id) },
      data
    });
    res.json(adjunto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el adjunto' });
  }
};

const deleteAdjunto = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.adjunto.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Adjunto eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el adjunto' });
  }
};

module.exports = {
  getAllAdjuntos,
  getAdjuntoById,
  createAdjunto,
  updateAdjunto,
  deleteAdjunto
};
