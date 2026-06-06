const prisma = require('../prisma');

// Devuelve los IDs de proyectos a los que el usuario tiene acceso (o null = todos, para admin).
async function getAccessibleProjectIds(userId, rolId) {
  if (rolId === 1) return null; // admin: todos

  const [memberships, projectMemberships] = await Promise.all([
    prisma.equipoUsuario.findMany({
      where: { usuarioId: userId, estado: 'ACEPTADO' },
      select: { equipoId: true },
    }),
    prisma.proyectoUsuario.findMany({
      where: { usuarioId: userId },
      select: { proyectoId: true },
    }),
  ]);
  const teamIds = memberships.map((m) => m.equipoId);

  const proyectosEquipo = teamIds.length
    ? await prisma.proyecto.findMany({ where: { equipoId: { in: teamIds } }, select: { id: true } })
    : [];

  const ids = new Set([
    ...proyectosEquipo.map((p) => p.id),
    ...projectMemberships.map((m) => m.proyectoId),
  ]);
  return [...ids];
}

// GET /dashboard  → métricas para el usuario autenticado
const getDashboard = async (req, res) => {
  try {
    const { userId, rolId } = req.user;
    const projectIds = await getAccessibleProjectIds(userId, rolId);
    const scope = projectIds === null ? {} : { proyectoId: { in: projectIds } };

    const ahora = new Date();

    const [
      porEstado,
      porPrioridad,
      totalTareas,
      misTareas,
      misTareasPendientes,
      vencidas,
      proyectosActivos,
      proyectosTotal,
    ] = await Promise.all([
      prisma.tarea.groupBy({ by: ['estado'], where: scope, _count: true }),
      prisma.tarea.groupBy({ by: ['prioridad'], where: scope, _count: true }),
      prisma.tarea.count({ where: scope }),
      prisma.tarea.count({ where: { ...scope, asignadoAId: userId } }),
      prisma.tarea.count({ where: { ...scope, asignadoAId: userId, estado: { not: 'FINALIZADO' } } }),
      prisma.tarea.count({ where: { ...scope, estado: { not: 'FINALIZADO' }, fechaVencimiento: { lt: ahora } } }),
      prisma.proyecto.count({ where: { ...(projectIds === null ? {} : { id: { in: projectIds } }), estado: 'ACTIVO' } }),
      prisma.proyecto.count({ where: projectIds === null ? {} : { id: { in: projectIds } } }),
    ]);

    // Normalizar agrupaciones a objetos { ESTADO: n }
    const estados = ['PENDIENTE', 'EN_PROGRESO', 'EN_REVISION', 'FINALIZADO'];
    const prioridades = ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'];
    const tareasPorEstado = Object.fromEntries(estados.map((e) => [e, 0]));
    porEstado.forEach((g) => { tareasPorEstado[g.estado] = g._count; });
    const tareasPorPrioridad = Object.fromEntries(prioridades.map((p) => [p, 0]));
    porPrioridad.forEach((g) => { tareasPorPrioridad[g.prioridad] = g._count; });

    const completadas = tareasPorEstado.FINALIZADO;
    const progreso = totalTareas > 0 ? Math.round((completadas / totalTareas) * 100) : 0;

    // Próximas tareas del usuario (con vencimiento, no finalizadas)
    const proximasTareas = await prisma.tarea.findMany({
      where: { ...scope, asignadoAId: userId, estado: { not: 'FINALIZADO' }, fechaVencimiento: { not: null } },
      orderBy: { fechaVencimiento: 'asc' },
      take: 5,
      include: { proyecto: { select: { id: true, nombre: true } } },
    });

    res.json({
      tareasPorEstado,
      tareasPorPrioridad,
      totalTareas,
      completadas,
      progreso,
      misTareas,
      misTareasPendientes,
      vencidas,
      proyectosActivos,
      proyectosTotal,
      proximasTareas,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el dashboard' });
  }
};

module.exports = { getDashboard };
