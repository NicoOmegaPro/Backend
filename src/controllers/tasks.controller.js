const prisma = require('../prisma');
const { registrarActividad } = require('../utils/registrarActividad');
const { notificar } = require('../utils/notificar');

const ESTADO_LABEL = {
  PENDIENTE: 'Pendiente',
  EN_PROGRESO: 'En progreso',
  EN_REVISION: 'En revisión',
  FINALIZADO: 'Finalizado',
};

// ¿Puede el usuario finalizar tareas del proyecto? (jefe de equipo, jefe de proyecto o supervisor)
async function puedeFinalizarTareas(userId, rolId, proyecto) {
  if (rolId === 1) return true;
  if (proyecto?.equipoId) {
    const mem = await prisma.equipoUsuario.findUnique({
      where: { usuarioId_equipoId: { usuarioId: userId, equipoId: proyecto.equipoId } },
    });
    if (mem?.rol === 'JEFE_EQUIPO' && mem.estado === 'ACEPTADO') return true;
  }
  const miembroProyecto = await prisma.proyectoUsuario.findUnique({
    where: { proyectoId_usuarioId: { proyectoId: proyecto.id, usuarioId: userId } },
  });
  return ['JEFE_PROYECTO', 'SUPERVISOR'].includes(miembroProyecto?.rol);
}

/* ───────────────────────────────────────────────────────────
   GET /tasks  →  con filtros y búsqueda
   Query: proyectoId, estado, prioridad, asignadoAId, sprintId,
          q (busca en título/descripción), vencidas=true
   ─────────────────────────────────────────────────────────── */
const getAllTasks = async (req, res) => {
  try {
    const { userId, rolId } = req.user;
    const { proyectoId, estado, prioridad, asignadoAId, sprintId, q, vencidas } = req.query;

    const and = [];

    // Ámbito: el admin ve todo; el resto solo tareas de proyectos de sus equipos o donde participa.
    if (rolId !== 1) {
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
        asignadoA: { select: { id: true, nombre: true, email: true } },
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
    // req.task ya viene cargado por requireTaskAccess (con su proyecto).
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
    // req.project viene de requireProjectAccess (la ruta valida acceso al proyecto del body).
    const { titulo, descripcion, estado, prioridad, asignadoAId, sprintId, fechaVencimiento } = req.body;
    const proyectoId = req.project.id;

    // Posición al final de su columna.
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
        asignadoA: { select: { id: true, nombre: true, email: true } },
      },
    });

    await registrarActividad({
      usuarioId: req.user.userId,
      entidadTipo: 'TAREA',
      entidadId: task.id,
      accion: 'CREADO',
      detalles: `creó la tarea «${task.titulo}»`,
    });

    // Notificar al asignado (si no es uno mismo).
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
    const { userId, rolId } = req.user;
    const prev = req.task; // estado anterior, cargado por el middleware
    const data = req.body;

    // Permiso para FINALIZAR: solo jefe de equipo, jefe de proyecto o supervisor.
    if (data.estado === 'FINALIZADO' && prev.estado !== 'FINALIZADO') {
      if (!(await puedeFinalizarTareas(userId, rolId, req.project))) {
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
        asignadoA: { select: { id: true, nombre: true, email: true } },
      },
    });

    // Historial
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

    // Notificación: reasignación de tarea
    if (data.asignadoAId !== undefined && data.asignadoAId && data.asignadoAId !== prev.asignadoAId) {
      await notificar({
        usuarioId: data.asignadoAId, actorId: userId, tipo: 'ASIGNACION_TAREA',
        mensaje: `Se te ha asignado la tarea «${task.titulo}» en ${task.proyecto.nombre}`,
      });
    }
    // Notificación: cambio de estado al asignado (si lo cambió otra persona)
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

// PUT /tasks/reorder  { columna: 'EN_PROGRESO', ids: [3,1,2] }
// Persiste el orden tras un drag & drop dentro de una columna.
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
    const { userId, rolId } = req.user;

    // Solo jefes/supervisores pueden eliminar tareas.
    if (!(await puedeFinalizarTareas(userId, rolId, req.project))) {
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

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  reorderTasks,
  deleteTask,
};
