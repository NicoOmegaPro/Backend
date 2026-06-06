const prisma = require('../prisma');

// Crea una notificación para un usuario. No lanza error si falla (best-effort),
// para que nunca rompa la acción principal que la origina.
// Evita auto-notificarse (si destinatario === actor no hace nada).
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
