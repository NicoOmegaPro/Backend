const prisma = require('../prisma');

/**
 * Registra una entrada en el historial de actividad.
 * Nunca lanza: si el log falla, la operación principal no debe romperse.
 *
 * @param {Object} opts
 * @param {number} opts.usuarioId  Autor de la acción.
 * @param {string} opts.entidadTipo  TAREA | PROYECTO | SPRINT | EQUIPO | MIEMBRO
 * @param {number} opts.entidadId
 * @param {string} opts.accion  CREADO | ACTUALIZADO | ELIMINADO | COMPLETADO
 * @param {string} [opts.detalles]  Frase legible (sin el nombre del autor, que se antepone en el front).
 */
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
    // El historial es secundario: registramos el fallo pero no interrumpimos.
    console.error('No se pudo registrar la actividad:', err.message);
  }
}

module.exports = { registrarActividad };
