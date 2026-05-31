const prisma = require('../prisma');
const { registrarActividad } = require('../utils/registrarActividad');

const ESTADO_LABEL = {
  PENDIENTE: 'Pendiente',
  EN_PROGRESO: 'En progreso',
  EN_REVISION: 'En revisión',
  FINALIZADO: 'Finalizado',
};

const getAllTasks = async (req, res) => {
  try {
    const { userId, rolId } = req.user;

    let where = {};
    if (rolId !== 1) {
      const myMemberships = await prisma.equipoUsuario.findMany({
        where: { usuarioId: userId, estado: 'ACEPTADO' },
        select: { equipoId: true },
      });
      const myTeamIds = myMemberships.map((m) => m.equipoId);

      if (myTeamIds.length === 0) return res.json([]);
      where = { proyecto: { equipoId: { in: myTeamIds } } };
    }

    const tasks = await prisma.tarea.findMany({
      where,
      include: {
        proyecto: { select: { nombre: true } },
        asignadoA: { select: { nombre: true, email: true } },
      },
    });
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
};

const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await prisma.tarea.findUnique({
      where: { id: parseInt(id) },
      include: {
        proyecto: true,
        asignadoA: { select: { nombre: true, email: true } },
        subtareas: true,
        comentarios: true
      }
    });
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });
    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la tarea' });
  }
};

const createTask = async (req, res) => {
  try {
    const { titulo, descripcion, estado, prioridad, proyectoId, asignadoAId, sprintId } = req.body;
    const task = await prisma.tarea.create({
      data: {
        titulo,
        descripcion,
        estado: estado || 'PENDIENTE',
        prioridad: prioridad || 'MEDIA',
        proyectoId: parseInt(proyectoId),
        asignadoAId: asignadoAId ? parseInt(asignadoAId) : null,
        sprintId: sprintId ? parseInt(sprintId) : null,
      },
      include: {
        proyecto: { select: { nombre: true } },
        asignadoA: { select: { nombre: true, email: true } },
      },
    });

    await registrarActividad({
      usuarioId: req.user.userId,
      entidadTipo: 'TAREA',
      entidadId: task.id,
      accion: 'CREADO',
      detalles: `creó la tarea «${task.titulo}»`,
    });

    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear tarea' });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, rolId } = req.user;
    const data = req.body;

    // Verificar permiso para FINALIZADO: jefe de equipo, jefe de proyecto o supervisor del proyecto.
    if (data.estado === 'FINALIZADO' && rolId !== 1) {
      const task = await prisma.tarea.findUnique({
        where: { id: parseInt(id) },
        select: { proyectoId: true, proyecto: { select: { equipoId: true } } },
      });
      if (task) {
        let esJefeEquipo = false;
        if (task.proyecto?.equipoId) {
          const mem = await prisma.equipoUsuario.findUnique({
            where: { usuarioId_equipoId: { usuarioId: userId, equipoId: task.proyecto.equipoId } },
          });
          esJefeEquipo = mem?.rol === 'JEFE_EQUIPO';
        }

        const miembroProyecto = await prisma.proyectoUsuario.findUnique({
          where: { proyectoId_usuarioId: { proyectoId: task.proyectoId, usuarioId: userId } },
        });
        const puedeFinalizar = esJefeEquipo || ['JEFE_PROYECTO', 'SUPERVISOR'].includes(miembroProyecto?.rol);

        if (!puedeFinalizar) {
          return res.status(403).json({
            error: 'Solo supervisores y jefes pueden finalizar tareas. Márcala como "En revisión" para que la revisen.',
          });
        }
      }
    }

    const task = await prisma.tarea.update({ where: { id: parseInt(id) }, data });

    if (data.estado === 'FINALIZADO') {
      await registrarActividad({
        usuarioId: userId,
        entidadTipo: 'TAREA',
        entidadId: task.id,
        accion: 'COMPLETADO',
        detalles: `completó la tarea «${task.titulo}»`,
      });
    } else {
      await registrarActividad({
        usuarioId: userId,
        entidadTipo: 'TAREA',
        entidadId: task.id,
        accion: 'ACTUALIZADO',
        detalles: data.estado
          ? `movió la tarea «${task.titulo}» a ${ESTADO_LABEL[data.estado] || data.estado}`
          : `actualizó la tarea «${task.titulo}»`,
      });
    }

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar tarea' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.tarea.findUnique({
      where: { id: parseInt(id) },
      select: { titulo: true },
    });
    await prisma.tarea.delete({
      where: { id: parseInt(id) }
    });

    await registrarActividad({
      usuarioId: req.user.userId,
      entidadTipo: 'TAREA',
      entidadId: parseInt(id),
      accion: 'ELIMINADO',
      detalles: existing ? `eliminó la tarea «${existing.titulo}»` : 'eliminó una tarea',
    });

    res.json({ message: 'Tarea eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar tarea' });
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
};
