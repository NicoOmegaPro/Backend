const prisma = require('../prisma');
const { registrarActividad } = require('../utils/registrarActividad');
const { getPageParams, buildMeta } = require('../utils/paginate');


async function getMembership(usuarioId, equipoId) {
  return prisma.equipoUsuario.findUnique({
    where: { usuarioId_equipoId: { usuarioId, equipoId } },
  });
}

const getAllEquipos = async (req, res) => {
  try {
    const { userId, esAdmin } = req.user;

    const where = esAdmin
      ? {}
      : { usuarios: { some: { usuarioId: userId, estado: 'ACEPTADO' } } };

    const include = {
      usuarios: {
        where: { estado: 'ACEPTADO' },
        include: { usuario: { select: { id: true, nombre: true, email: true, imagenPerfil: true } } },
      },
      proyectos: { select: { id: true, nombre: true, estado: true } },
    };

    const withRol = (eq) => {
      const mem = eq.usuarios.find((u) => u.usuarioId === userId);
      return { ...eq, myRol: esAdmin ? 'JEFE_EQUIPO' : (mem?.rol ?? null) };
    };

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      const { page, limit, skip } = getPageParams(req, { defaultLimit: 10 });
      const [equipos, total] = await Promise.all([
        prisma.equipo.findMany({ where, include, orderBy: { id: 'asc' }, skip, take: limit }),
        prisma.equipo.count({ where }),
      ]);
      return res.json({ items: equipos.map(withRol), ...buildMeta({ page, limit, total }) });
    }

    const equipos = await prisma.equipo.findMany({ where, include, orderBy: { id: 'asc' } });
    res.json(equipos.map(withRol));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener equipos' });
  }
};

const getEquipoById = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, esAdmin } = req.user;

    const equipo = await prisma.equipo.findUnique({
      where: { id: parseInt(id) },
      include: {
        usuarios: {
          include: { usuario: { select: { id: true, nombre: true, email: true, imagenPerfil: true } } },
        },
        proyectos: { select: { id: true, nombre: true, estado: true } },
      },
    });
    if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' });

    const mem = equipo.usuarios.find((u) => u.usuarioId === userId);
    res.json({ ...equipo, myRol: esAdmin ? 'JEFE_EQUIPO' : (mem?.rol ?? null) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el equipo' });
  }
};

const createEquipo = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    const { id: userId } = req.user;

    if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });

    const equipo = await prisma.equipo.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        usuarios: {
          create: { usuarioId: userId, rol: 'JEFE_EQUIPO', estado: 'ACEPTADO' },
        },
      },
      include: {
        usuarios: {
          include: { usuario: { select: { id: true, nombre: true, email: true } } },
        },
      },
    });

    await registrarActividad({
      usuarioId: userId,
      entidadTipo: 'EQUIPO',
      entidadId: equipo.id,
      accion: 'CREADO',
      detalles: `creó el equipo «${equipo.nombre}»`,
    });

    res.status(201).json({ ...equipo, myRol: 'JEFE_EQUIPO' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear equipo' });
  }
};

const invitarMiembro = async (req, res) => {
  try {
    const equipoId = parseInt(req.params.id);
    const { userId, esAdmin } = req.user;
    const { email } = req.body;
    const rol = 'MIEMBRO';

    if (!email) return res.status(400).json({ error: 'El email es obligatorio' });

    if (!esAdmin) {
      const mem = await getMembership(userId, equipoId);
      if (!mem || mem.rol !== 'JEFE_EQUIPO' || mem.estado !== 'ACEPTADO') {
        return res.status(403).json({ error: 'Solo el jefe de equipo puede invitar miembros' });
      }
    }

    const invitado = await prisma.usuario.findUnique({ where: { email: email.trim() } });
    if (!invitado) return res.status(404).json({ error: 'No existe ningún usuario con ese email' });
    if (invitado.id === userId) return res.status(400).json({ error: 'No puedes invitarte a ti mismo' });

    const yaExiste = await getMembership(invitado.id, equipoId);
    if (yaExiste) {
      if (yaExiste.estado === 'ACEPTADO') return res.status(409).json({ error: 'El usuario ya es miembro del equipo' });
      if (yaExiste.estado === 'PENDIENTE') return res.status(409).json({ error: 'Ya tienes una invitación pendiente para este usuario' });
      await prisma.equipoUsuario.update({
        where: { usuarioId_equipoId: { usuarioId: invitado.id, equipoId } },
        data: { rol, estado: 'PENDIENTE' },
      });
    } else {
      await prisma.equipoUsuario.create({
        data: { usuarioId: invitado.id, equipoId, rol, estado: 'PENDIENTE' },
      });
    }

    const equipo = await prisma.equipo.findUnique({ where: { id: equipoId }, select: { nombre: true } });
    const invitador = await prisma.usuario.findUnique({ where: { id: userId }, select: { nombre: true } });

    const mensajeData = JSON.stringify({
      tipo: 'INVITACION_EQUIPO',
      equipoId,
      equipoNombre: equipo?.nombre,
      invitadoPor: invitador?.nombre,
      rol,
    });

    await prisma.notificacion.create({
      data: {
        mensaje: mensajeData,
        tipo: 'INVITACION_EQUIPO',
        usuarioId: invitado.id,
        leida: false,
      },
    });

    await registrarActividad({
      usuarioId: userId,
      entidadTipo: 'EQUIPO',
      entidadId: equipoId,
      accion: 'ACTUALIZADO',
      detalles: `invitó a ${invitado.nombre} al equipo «${equipo?.nombre || ''}»`,
    });

    res.json({ message: `Invitación enviada a ${invitado.nombre}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al enviar la invitación' });
  }
};

const aceptarInvitacion = async (req, res) => {
  try {
    const equipoId = parseInt(req.params.id);
    const { id: userId } = req.user;

    const mem = await getMembership(userId, equipoId);
    if (!mem) return res.status(404).json({ error: 'Invitación no encontrada' });
    if (mem.estado !== 'PENDIENTE') return res.status(400).json({ error: 'No hay invitación pendiente' });

    await prisma.equipoUsuario.update({
      where: { usuarioId_equipoId: { usuarioId: userId, equipoId } },
      data: { estado: 'ACEPTADO' },
    });

    const notifsRaw = await prisma.notificacion.findMany({
      where: { usuarioId: userId, tipo: 'INVITACION_EQUIPO', leida: false },
    });
    const notifIds = notifsRaw
      .filter((n) => {
        try { return JSON.parse(n.mensaje).equipoId === equipoId; } catch { return false; }
      })
      .map((n) => n.id);

    if (notifIds.length > 0) {
      await prisma.notificacion.updateMany({ where: { id: { in: notifIds } }, data: { leida: true } });
    }

    const equipo = await prisma.equipo.findUnique({ where: { id: equipoId }, select: { nombre: true } });
    await registrarActividad({
      usuarioId: userId,
      entidadTipo: 'EQUIPO',
      entidadId: equipoId,
      accion: 'CREADO',
      detalles: `se unió al equipo «${equipo?.nombre || ''}»`,
    });

    res.json({ message: 'Invitación aceptada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al aceptar la invitación' });
  }
};

const rechazarInvitacion = async (req, res) => {
  try {
    const equipoId = parseInt(req.params.id);
    const { id: userId } = req.user;

    const mem = await getMembership(userId, equipoId);
    if (!mem || mem.estado !== 'PENDIENTE') {
      return res.status(404).json({ error: 'Invitación no encontrada' });
    }

    await prisma.equipoUsuario.delete({
      where: { usuarioId_equipoId: { usuarioId: userId, equipoId } },
    });

    const notifsRaw = await prisma.notificacion.findMany({
      where: { usuarioId: userId, tipo: 'INVITACION_EQUIPO', leida: false },
    });
    const notifIds = notifsRaw
      .filter((n) => {
        try { return JSON.parse(n.mensaje).equipoId === equipoId; } catch { return false; }
      })
      .map((n) => n.id);

    if (notifIds.length > 0) {
      await prisma.notificacion.updateMany({ where: { id: { in: notifIds } }, data: { leida: true } });
    }

    res.json({ message: 'Invitación rechazada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al rechazar la invitación' });
  }
};

const ROLES_ASIGNABLES = ['SUPERVISOR', 'MIEMBRO'];
const cambiarRolMiembro = async (req, res) => {
  try {
    const equipoId = parseInt(req.params.id);
    const targetUserId = parseInt(req.params.userId);
    const { userId, esAdmin } = req.user;
    const rol = req.body.rol;

    if (!ROLES_ASIGNABLES.includes(rol)) {
      return res.status(400).json({ error: 'Rol no válido. Usa: SUPERVISOR o MIEMBRO' });
    }

    if (!esAdmin) {
      const mem = await getMembership(userId, equipoId);
      if (!mem || mem.rol !== 'JEFE_EQUIPO' || mem.estado !== 'ACEPTADO') {
        return res.status(403).json({ error: 'Solo el jefe de equipo puede cambiar roles' });
      }
    }

    const targetMem = await getMembership(targetUserId, equipoId);
    if (!targetMem || targetMem.estado !== 'ACEPTADO') {
      return res.status(404).json({ error: 'El usuario no es miembro del equipo' });
    }
    if (targetMem.rol === 'JEFE_EQUIPO') {
      return res.status(400).json({ error: 'No puedes cambiar el rol del jefe de equipo' });
    }

    const updated = await prisma.equipoUsuario.update({
      where: { usuarioId_equipoId: { usuarioId: targetUserId, equipoId } },
      data: { rol },
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar el rol del miembro' });
  }
};

const expulsarMiembro = async (req, res) => {
  try {
    const equipoId = parseInt(req.params.id);
    const targetUserId = parseInt(req.params.userId);
    const { userId, esAdmin } = req.user;

    if (!esAdmin) {
      const mem = await getMembership(userId, equipoId);
      if (!mem || mem.rol !== 'JEFE_EQUIPO') {
        return res.status(403).json({ error: 'Solo el jefe de equipo puede expulsar miembros' });
      }
    }

    if (targetUserId === userId) {
      return res.status(400).json({ error: 'No puedes expulsarte a ti mismo. Usa "abandonar equipo"' });
    }

    const targetMem = await getMembership(targetUserId, equipoId);
    if (!targetMem) return res.status(404).json({ error: 'El usuario no es miembro del equipo' });
    if (targetMem.rol === 'JEFE_EQUIPO') return res.status(400).json({ error: 'No puedes expulsar al jefe de equipo' });

    await prisma.equipoUsuario.delete({
      where: { usuarioId_equipoId: { usuarioId: targetUserId, equipoId } },
    });

    res.json({ message: 'Miembro eliminado del equipo' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al expulsar miembro' });
  }
};

const updateEquipo = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, esAdmin } = req.user;
    const equipoId = parseInt(id);

    if (!esAdmin) {
      const mem = await getMembership(userId, equipoId);
      if (!mem || mem.rol !== 'JEFE_EQUIPO') {
        return res.status(403).json({ error: 'Solo el jefe de equipo puede editar el equipo' });
      }
    }

    const { nombre, descripcion, imagen } = req.body;
    const data = {};
    if (nombre !== undefined) data.nombre = nombre;
    if (descripcion !== undefined) data.descripcion = descripcion;
    if (imagen !== undefined) data.imagen = imagen;
    const equipo = await prisma.equipo.update({ where: { id: equipoId }, data });
    res.json(equipo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar equipo' });
  }
};

const uploadImagenEquipo = async (req, res) => {
  try {
    const equipoId = parseInt(req.params.id);
    const { userId, esAdmin } = req.user;

    if (!esAdmin) {
      const mem = await getMembership(userId, equipoId);
      if (!mem || mem.rol !== 'JEFE_EQUIPO') {
        return res.status(403).json({ error: 'Solo el jefe de equipo puede cambiar la imagen' });
      }
    }

    if (!req.file) return res.status(400).json({ error: 'No se ha subido ninguna imagen' });

    const ruta = `/uploads/${req.file.filename}`;
    const equipo = await prisma.equipo.update({ where: { id: equipoId }, data: { imagen: ruta } });
    res.json({ imagen: equipo.imagen });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al subir la imagen del equipo' });
  }
};

const deleteEquipo = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, esAdmin } = req.user;
    const equipoId = parseInt(id);

    if (!esAdmin) {
      const mem = await getMembership(userId, equipoId);
      if (!mem || mem.rol !== 'JEFE_EQUIPO') {
        return res.status(403).json({ error: 'Solo el jefe de equipo puede eliminar el equipo' });
      }
    }

    await prisma.equipo.delete({ where: { id: equipoId } });
    res.json({ message: 'Equipo eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el equipo' });
  }
};

module.exports = {
  getAllEquipos,
  getEquipoById,
  createEquipo,
  updateEquipo,
  deleteEquipo,
  invitarMiembro,
  aceptarInvitacion,
  rechazarInvitacion,
  cambiarRolMiembro,
  expulsarMiembro,
  uploadImagenEquipo,
};
