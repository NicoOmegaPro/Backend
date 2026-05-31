const prisma = require('../prisma');

const getAllHistorial = async (req, res) => {
  try {
    const { userId, rolId } = req.user;

    let where = {};
    if (rolId !== 1) {
      const myMemberships = await prisma.equipoUsuario.findMany({
        where: { usuarioId: userId },
        select: { equipoId: true },
      });
      const myTeamIds = myMemberships.map((m) => m.equipoId);

      if (myTeamIds.length > 0) {
        const teammates = await prisma.equipoUsuario.findMany({
          where: { equipoId: { in: myTeamIds } },
          select: { usuarioId: true },
        });
        const teammateIds = [...new Set(teammates.map((t) => t.usuarioId))];
        where = { usuarioId: { in: teammateIds } };
      } else {
        where = { usuarioId: userId };
      }
    }

    const historial = await prisma.historialActividad.findMany({
      where,
      include: {
        usuario: { select: { id: true, nombre: true, email: true } }
      },
      orderBy: { fecha: 'desc' },
      take: 100,
    });
    res.json(historial);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el historial de actividades' });
  }
};

const getHistorialById = async (req, res) => {
  try {
    const { id } = req.params;
    const registro = await prisma.historialActividad.findUnique({
      where: { id: parseInt(id) },
      include: {
        usuario: { select: { id: true, nombre: true, email: true } }
      }
    });
    if (!registro) return res.status(404).json({ error: 'Registro no encontrado' });
    res.json(registro);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el registro de historial' });
  }
};

const createHistorial = async (req, res) => {
  try {
    const { entidadTipo, entidadId, accion, detalles, usuarioId } = req.body;
    const registro = await prisma.historialActividad.create({
      data: {
        entidadTipo,
        entidadId: parseInt(entidadId),
        accion,
        detalles,
        usuarioId: parseInt(usuarioId)
      }
    });
    res.status(201).json(registro);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el registro de historial' });
  }
};

const updateHistorial = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const registro = await prisma.historialActividad.update({
      where: { id: parseInt(id) },
      data
    });
    res.json(registro);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el registro de historial' });
  }
};

const deleteHistorial = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.historialActividad.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Registro de historial eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el registro de historial' });
  }
};

module.exports = {
  getAllHistorial,
  getHistorialById,
  createHistorial,
  updateHistorial,
  deleteHistorial
};
