const prisma = require('../prisma');

// GET /notificaciones?page=&limit=&soloNoLeidas=
// Devuelve SOLO las notificaciones del usuario autenticado.
const getAllNotificaciones = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const soloNoLeidas = req.query.soloNoLeidas === 'true';

    const where = { usuarioId: userId, ...(soloNoLeidas ? { leida: false } : {}) };

    const [items, total, noLeidas] = await Promise.all([
      prisma.notificacion.findMany({
        where,
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notificacion.count({ where }),
      prisma.notificacion.count({ where: { usuarioId: userId, leida: false } }),
    ]);

    res.json({ items, total, noLeidas, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
};

// PUT /notificaciones/:id  { leida }  → solo notificaciones propias
const updateNotificacion = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notif = await prisma.notificacion.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!notif || notif.usuarioId !== userId) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    const updated = await prisma.notificacion.update({
      where: { id: notif.id },
      data: { leida: req.body.leida ?? true },
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la notificación' });
  }
};

// PUT /notificaciones/marcar-todas  → marca todas las del usuario como leídas
const marcarTodasLeidas = async (req, res) => {
  try {
    await prisma.notificacion.updateMany({
      where: { usuarioId: req.user.userId, leida: false },
      data: { leida: true },
    });
    res.json({ message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al marcar las notificaciones' });
  }
};

// DELETE /notificaciones/:id  → solo notificaciones propias
const deleteNotificacion = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notif = await prisma.notificacion.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!notif || notif.usuarioId !== userId) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    await prisma.notificacion.delete({ where: { id: notif.id } });
    res.json({ message: 'Notificación eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar la notificación' });
  }
};

module.exports = {
  getAllNotificaciones,
  updateNotificacion,
  marcarTodasLeidas,
  deleteNotificacion,
};
