const prisma = require('../prisma');

async function registrarActividad({ usuarioId, entidadTipo, entidadId, accion, detalles }) {
  try {
    if (!usuarioId) return;
    await prisma.historialActividad.create({
      data: {
        usuarioId: parseInt(usuarioId),
        entidadTipo,
        entidadId: entidadId ? parseInt(entidadId) : 0,
        accion,
        detalles: detalles || null,
      },
    });
  } catch (err) {
    console.error('No se pudo registrar la actividad:', err.message);
  }
}

module.exports = { registrarActividad };
