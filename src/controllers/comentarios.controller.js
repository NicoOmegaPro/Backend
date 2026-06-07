const prisma = require('../prisma');
const { notificar } = require('../utils/notificar');
const { ROLES_GESTION, rolEnProyecto } = require('../utils/permissions');

// GET /comentarios?tareaId=  → comentarios de una tarea (requiere acceso a la tarea)
const getAllComentarios = async (req, res) => {
  try {
    const { tareaId } = req.query;
    if (!tareaId) return res.status(400).json({ error: 'Falta el parámetro tareaId' });

    const comentarios = await prisma.comentario.findMany({
      where: { tareaId: parseInt(tareaId) },
      orderBy: { fecha: 'asc' },
      include: { autor: { select: { id: true, nombre: true, email: true, imagenPerfil: true } } },
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
        autor: { select: { id: true, nombre: true, email: true } },
      },
    });
    if (!comentario) return res.status(404).json({ error: 'Comentario no encontrado' });
    res.json(comentario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el comentario' });
  }
};

// POST /comentarios  { contenido, tareaId }  → autor = usuario autenticado
// req.task viene de requireBodyTaskAccess
const createComentario = async (req, res) => {
  try {
    const { contenido } = req.body;
    const autorId = req.user.userId;

    const comentario = await prisma.comentario.create({
      data: { contenido, tareaId: req.task.id, autorId },
      include: { autor: { select: { id: true, nombre: true, email: true, imagenPerfil: true } } },
    });

    // Notificar al asignado de la tarea (si no es el propio autor).
    if (req.task.asignadoAId) {
      await notificar({
        usuarioId: req.task.asignadoAId, actorId: autorId, tipo: 'COMENTARIO',
        mensaje: `${comentario.autor.nombre} comentó en «${req.task.titulo}»`,
      });
    }

    res.status(201).json(comentario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear comentario' });
  }
};

// DELETE /comentarios/:id  → solo el autor o un gestor del proyecto
const deleteComentario = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, esAdmin } = req.user;

    const comentario = await prisma.comentario.findUnique({
      where: { id: parseInt(id) },
      include: { tarea: { include: { proyecto: true } } },
    });
    if (!comentario) return res.status(404).json({ error: 'Comentario no encontrado' });

    const esAutor = comentario.autorId === userId;
    const miRol = await rolEnProyecto(userId, esAdmin, comentario.tarea.proyecto);
    if (!esAutor && !ROLES_GESTION.includes(miRol)) {
      return res.status(403).json({ error: 'No puedes eliminar este comentario' });
    }

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
  deleteComentario,
};
