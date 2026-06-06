const fs = require('fs');
const path = require('path');
const prisma = require('../prisma');
const { canAccessProject, ROLES_GESTION, rolEnProyecto } = require('../utils/permissions');

// GET /adjuntos?tareaId=
const getAllAdjuntos = async (req, res) => {
  try {
    const { tareaId } = req.query;
    if (!tareaId) return res.status(400).json({ error: 'Falta el parámetro tareaId' });

    const adjuntos = await prisma.adjunto.findMany({
      where: { tareaId: parseInt(tareaId) },
      orderBy: { fecha: 'desc' },
      include: { usuario: { select: { id: true, nombre: true } } },
    });
    res.json(adjuntos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener adjuntos' });
  }
};

// POST /adjuntos  { rutaLocal, nombre, tareaId }  → subidoPor = usuario autenticado
// req.task viene de requireBodyTaskAccess
const createAdjunto = async (req, res) => {
  try {
    const { rutaLocal, nombre } = req.body;
    if (!rutaLocal || !nombre) return res.status(400).json({ error: 'Faltan datos del archivo' });

    const adjunto = await prisma.adjunto.create({
      data: { rutaLocal, nombre, tareaId: req.task.id, subidoPor: req.user.userId },
      include: { usuario: { select: { id: true, nombre: true } } },
    });
    res.status(201).json(adjunto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar el adjunto' });
  }
};

// DELETE /adjuntos/:id  → quien lo subió o un gestor del proyecto; borra también el fichero.
const deleteAdjunto = async (req, res) => {
  try {
    const { userId, rolId } = req.user;
    const adjunto = await prisma.adjunto.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { tarea: { include: { proyecto: true } } },
    });
    if (!adjunto) return res.status(404).json({ error: 'Adjunto no encontrado' });

    if (!(await canAccessProject(userId, rolId, adjunto.tarea.proyecto))) {
      return res.status(403).json({ error: 'No tienes acceso a este adjunto' });
    }
    const esPropietario = adjunto.subidoPor === userId;
    const miRol = await rolEnProyecto(userId, rolId, adjunto.tarea.proyecto);
    if (!esPropietario && !ROLES_GESTION.includes(miRol)) {
      return res.status(403).json({ error: 'No puedes eliminar este adjunto' });
    }

    await prisma.adjunto.delete({ where: { id: adjunto.id } });

    // Borrar el fichero físico (best-effort).
    if (adjunto.rutaLocal?.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '../../public', adjunto.rutaLocal);
      fs.unlink(filePath, () => {});
    }

    res.json({ message: 'Adjunto eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el adjunto' });
  }
};

module.exports = {
  getAllAdjuntos,
  createAdjunto,
  deleteAdjunto,
};
