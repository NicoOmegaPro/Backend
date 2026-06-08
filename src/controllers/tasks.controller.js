const prisma = require('../prisma');
const { registrarActividad } = require('../utils/registrarActividad');
const { notificar } = require('../utils/notificar');

const ESTADO_LABEL = {
  PENDIENTE: 'Pendiente',
  EN_PROGRESO: 'En progreso',
  EN_REVISION: 'En revisión',
  FINALIZADO: 'Finalizado',
};

async function puedeFinalizarTareas(userId, esAdmin, proyecto) {
  if (esAdmin) return true;
  if (!proyecto?.equipoId) return false;
  const mem = await prisma.equipoUsuario.findUnique({
    where: { usuarioId_equipoId: { usuarioId: userId, equipoId: proyecto.equipoId } },
  });
  return mem?.estado === 'ACEPTADO' && ['JEFE_EQUIPO', 'SUPERVISOR'].includes(mem.rol);
}

const getAllTasks = async (req, res) => {
  try {
    const { userId, esAdmin } = req.user;
    const { proyectoId, estado, prioridad, asignadoAId, sprintId, q, vencidas } = req.query;

    const and = [];

    if (!esAdmin) {
      const memberships = await prisma.equipoUsuario.findMany({
        where: { usuarioId: userId, estado: 'ACEPTADO' },
        select: { equipoId: true },
      });
      const teamIds = memberships.map((m) => m.equipoId);
      and.push({
        proyecto: {
          OR: [
            { equipoId: { in: teamIds } },
            { miembros: { some: { usuarioId: userId } } },
          ],
        },
      });
    }

    if (proyectoId) and.push({ proyectoId: parseInt(proyectoId) });
    if (estado) and.push({ estado });
    if (prioridad) and.push({ prioridad });
    if (asignadoAId) and.push({ asignadoAId: parseInt(asignadoAId) });
    if (sprintId) and.push(sprintId === 'null' ? { sprintId: null } : { sprintId: parseInt(sprintId) });
    if (q && q.trim()) {
      and.push({
        OR: [
          { titulo: { contains: q.trim(), mode: 'insensitive' } },
          { descripcion: { contains: q.trim(), mode: 'insensitive' } },
        ],
      });
    }
    if (vencidas === 'true') {
      and.push({ fechaVencimiento: { lt: new Date() }, estado: { not: 'FINALIZADO' } });
    }

    const tasks = await prisma.tarea.findMany({
      where: and.length ? { AND: and } : {},
      include: {
        proyecto: { select: { id: true, nombre: true } },
        asignadoA: { select: { id: true, nombre: true, email: true, imagenPerfil: true } },
        etiquetas: { include: { etiqueta: true } },
        _count: { select: { subtareas: true, comentarios: true, adjuntos: true } },
      },
      orderBy: [{ orden: 'asc' }, { id: 'asc' }],
    });
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
};

const getTaskById = async (req, res) => {
  try {
    const task = await prisma.tarea.findUnique({
      where: { id: req.task.id },
      include: {
        proyecto: { select: { id: true, nombre: true, equipoId: true } },
        asignadoA: { select: { id: true, nombre: true, email: true, imagenPerfil: true } },
        sprint: { select: { id: true, nombre: true } },
        subtareas: { orderBy: { id: 'asc' } },
        comentarios: {
          orderBy: { fecha: 'asc' },
          include: { autor: { select: { id: true, nombre: true, imagenPerfil: true } } },
        },
        adjuntos: {
          orderBy: { fecha: 'desc' },
          include: { usuario: { select: { id: true, nombre: true } } },
        },
        etiquetas: { include: { etiqueta: true } },
      },
    });
    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la tarea' });
  }
};

const createTask = async (req, res) => {
  try {
    const { titulo, descripcion, estado, prioridad, asignadoAId, sprintId, fechaVencimiento } = req.body;
    const proyectoId = req.project.id;

    const max = await prisma.tarea.aggregate({
      where: { proyectoId, estado: estado || 'PENDIENTE' },
      _max: { orden: true },
    });

    const task = await prisma.tarea.create({
      data: {
        titulo,
        descripcion: descripcion || null,
        estado: estado || 'PENDIENTE',
        prioridad: prioridad || 'MEDIA',
        proyectoId,
        asignadoAId: asignadoAId ?? null,
        sprintId: sprintId ?? null,
        fechaVencimiento: fechaVencimiento ?? null,
        orden: (max._max.orden ?? 0) + 1,
      },
      include: {
        proyecto: { select: { id: true, nombre: true } },
        asignadoA: { select: { id: true, nombre: true, email: true, imagenPerfil: true } },
      },
    });

    await registrarActividad({
      usuarioId: req.user.userId,
      entidadTipo: 'TAREA',
      entidadId: task.id,
      accion: 'CREADO',
      detalles: `creó la tarea «${task.titulo}»`,
    });

    if (task.asignadoAId) {
      await notificar({
        usuarioId: task.asignadoAId,
        actorId: req.user.userId,
        tipo: 'ASIGNACION_TAREA',
        mensaje: `Se te ha asignado la tarea «${task.titulo}» en ${task.proyecto.nombre}`,
      });
    }

    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear tarea' });
  }
};

const updateTask = async (req, res) => {
  try {
    const { userId, esAdmin } = req.user;
    const prev = req.task;
    const data = req.body;

    if (data.estado === 'FINALIZADO' && prev.estado !== 'FINALIZADO') {
      if (!(await puedeFinalizarTareas(userId, esAdmin, req.project))) {
        return res.status(403).json({
          error: 'Solo supervisores y jefes pueden finalizar tareas. Márcala como "En revisión" para que la revisen.',
        });
      }
    }

    const task = await prisma.tarea.update({
      where: { id: prev.id },
      data,
      include: {
        proyecto: { select: { id: true, nombre: true } },
        asignadoA: { select: { id: true, nombre: true, email: true, imagenPerfil: true } },
      },
    });

    if (data.estado === 'FINALIZADO') {
      await registrarActividad({
        usuarioId: userId, entidadTipo: 'TAREA', entidadId: task.id,
        accion: 'COMPLETADO', detalles: `completó la tarea «${task.titulo}»`,
      });
    } else {
      await registrarActividad({
        usuarioId: userId, entidadTipo: 'TAREA', entidadId: task.id,
        accion: 'ACTUALIZADO',
        detalles: data.estado
          ? `movió la tarea «${task.titulo}» a ${ESTADO_LABEL[data.estado] || data.estado}`
          : `actualizó la tarea «${task.titulo}»`,
      });
    }

    if (data.asignadoAId !== undefined && data.asignadoAId && data.asignadoAId !== prev.asignadoAId) {
      await notificar({
        usuarioId: data.asignadoAId, actorId: userId, tipo: 'ASIGNACION_TAREA',
        mensaje: `Se te ha asignado la tarea «${task.titulo}» en ${task.proyecto.nombre}`,
      });
    }
    if (data.estado && data.estado !== prev.estado && task.asignadoAId) {
      await notificar({
        usuarioId: task.asignadoAId, actorId: userId, tipo: 'CAMBIO_ESTADO',
        mensaje: `La tarea «${task.titulo}» pasó a ${ESTADO_LABEL[data.estado] || data.estado}`,
      });
    }

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar tarea' });
  }
};

const reorderTasks = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'Se espera un array "ids"' });

    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.tarea.update({ where: { id: parseInt(id) }, data: { orden: index } })
      )
    );
    res.json({ message: 'Orden actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al reordenar tareas' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { userId, esAdmin } = req.user;

    if (!(await puedeFinalizarTareas(userId, esAdmin, req.project))) {
      return res.status(403).json({ error: 'Solo supervisores y jefes pueden eliminar tareas' });
    }

    const titulo = req.task.titulo;
    await prisma.tarea.delete({ where: { id: req.task.id } });

    await registrarActividad({
      usuarioId: userId, entidadTipo: 'TAREA', entidadId: req.task.id,
      accion: 'ELIMINADO', detalles: `eliminó la tarea «${titulo}»`,
    });

    res.json({ message: 'Tarea eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar tarea' });
  }
};

const addEtiqueta = async (req, res) => {
  try {
    const etiquetaId = parseInt(req.body.etiquetaId);
    if (!etiquetaId) return res.status(400).json({ error: 'etiquetaId requerido' });

    await prisma.tareaEtiqueta.upsert({
      where: { tareaId_etiquetaId: { tareaId: req.task.id, etiquetaId } },
      update: {},
      create: { tareaId: req.task.id, etiquetaId },
    });

    const etiquetas = await prisma.tareaEtiqueta.findMany({
      where: { tareaId: req.task.id },
      include: { etiqueta: true },
    });
    res.json(etiquetas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al añadir etiqueta' });
  }
};

const removeEtiqueta = async (req, res) => {
  try {
    const etiquetaId = parseInt(req.params.etiquetaId);
    await prisma.tareaEtiqueta.deleteMany({
      where: { tareaId: req.task.id, etiquetaId },
    });

    const etiquetas = await prisma.tareaEtiqueta.findMany({
      where: { tareaId: req.task.id },
      include: { etiqueta: true },
    });
    res.json(etiquetas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al quitar etiqueta' });
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  reorderTasks,
  deleteTask,
  addEtiqueta,
  removeEtiqueta,
};
