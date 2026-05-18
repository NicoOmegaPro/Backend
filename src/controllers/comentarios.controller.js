const prisma = require('../prisma');

const getAllComentarios = async (req, res) => {
  try {
    const comentarios = await prisma.comentario.findMany({
      include: {
        tarea: { select: { id: true, titulo: true } },
        autor: { select: { id: true, nombre: true, email: true } }
      }
    });
    res.json(comentarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener comentarios' });
  }
};

const getComentarioById = async (req, res) => {
  try {
    const { id } = req.params;
    const comentario = await prisma.comentario.findUnique({
      where: { id: parseInt(id) },
      include: {
        tarea: { select: { id: true, titulo: true } },
        autor: { select: { id: true, nombre: true, email: true } }
      }
    });
    if (!comentario) return res.status(404).json({ error: 'Comentario no encontrado' });
    res.json(comentario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el comentario' });
  }
};

const createComentario = async (req, res) => {
  try {
    const { contenido, tareaId, autorId } = req.body;
    const comentario = await prisma.comentario.create({
      data: {
        contenido,
        tareaId: parseInt(tareaId),
        autorId: parseInt(autorId)
      }
    });
    res.status(201).json(comentario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear comentario' });
  }
};

const updateComentario = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const comentario = await prisma.comentario.update({
      where: { id: parseInt(id) },
      data
    });
    res.json(comentario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el comentario' });
  }
};

const deleteComentario = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.comentario.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Comentario eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el comentario' });
  }
};

module.exports = {
  getAllComentarios,
  getComentarioById,
  createComentario,
  updateComentario,
  deleteComentario
};
