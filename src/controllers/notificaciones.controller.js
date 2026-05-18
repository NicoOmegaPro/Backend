const prisma = require('../prisma');

const getAllNotificaciones = async (req, res) => {
  try {
    const notificaciones = await prisma.notificacion.findMany({
      include: {
        usuario: { select: { id: true, nombre: true, email: true } }
      }
    });
    res.json(notificaciones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
};

const getNotificacionById = async (req, res) => {
  try {
    const { id } = req.params;
    const notificacion = await prisma.notificacion.findUnique({
      where: { id: parseInt(id) },
      include: {
        usuario: { select: { id: true, nombre: true, email: true } }
      }
    });
    if (!notificacion) return res.status(404).json({ error: 'Notificación no encontrada' });
    res.json(notificacion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la notificación' });
  }
};

const createNotificacion = async (req, res) => {
  try {
    const { mensaje, tipo, leida, usuarioId } = req.body;
    const notificacion = await prisma.notificacion.create({
      data: {
        mensaje,
        tipo,
        leida: leida ?? false,
        usuarioId: parseInt(usuarioId)
      }
    });
    res.status(201).json(notificacion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear notificación' });
  }
};

const updateNotificacion = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const notificacion = await prisma.notificacion.update({
      where: { id: parseInt(id) },
      data
    });
    res.json(notificacion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la notificación' });
  }
};

const deleteNotificacion = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.notificacion.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Notificación eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar la notificación' });
  }
};

module.exports = {
  getAllNotificaciones,
  getNotificacionById,
  createNotificacion,
  updateNotificacion,
  deleteNotificacion
};
