const prisma = require('../prisma');

async function notificar({ usuarioId, tipo, mensaje, actorId = null }) {
  try {
    if (!usuarioId) return;
    if (actorId && actorId === usuarioId) return;
    await prisma.notificacion.create({
      data: { usuarioId, tipo, mensaje, leida: false },
    });
  } catch (error) {
    console.error('Error al crear notificación:', error.message);
  }
}

module.exports = { notificar };
