const prisma = require('../prisma');

async function getAccessibleProjectIds(userId, esAdmin) {
  if (esAdmin) return null;

  const memberships = await prisma.equipoUsuario.findMany({
    where: { usuarioId: userId, estado: 'ACEPTADO' },
    select: { equipoId: true },
  });
  const teamIds = memberships.map((m) => m.equipoId);
  if (!teamIds.length) return [];

  const proyectos = await prisma.proyecto.findMany({
    where: { equipoId: { in: teamIds } },
    select: { id: true },
  });
  return proyectos.map((p) => p.id);
}

const getDashboard = async (req, res) => {
  try {
    const { userId, esAdmin } = req.user;
    const projectIds = await getAccessibleProjectIds(userId, esAdmin);
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

    const estados = ['PENDIENTE', 'EN_PROGRESO', 'EN_REVISION', 'FINALIZADO'];
    const prioridades = ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'];
    const tareasPorEstado = Object.fromEntries(estados.map((e) => [e, 0]));
    porEstado.forEach((g) => { tareasPorEstado[g.estado] = g._count; });
    const tareasPorPrioridad = Object.fromEntries(prioridades.map((p) => [p, 0]));
    porPrioridad.forEach((g) => { tareasPorPrioridad[g.prioridad] = g._count; });

    const completadas = tareasPorEstado.FINALIZADO;
    const progreso = totalTareas > 0 ? Math.round((completadas / totalTareas) * 100) : 0;

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
