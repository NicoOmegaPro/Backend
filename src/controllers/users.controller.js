const prisma = require('../prisma');
const bcrypt = require('bcrypt');
const { getPageParams, buildMeta } = require('../utils/paginate');

const getAllUsers = async (req, res) => {
  try {
    const { userId, rolId } = req.user;

    let where = {};
    if (rolId !== 1) {
      // Si el usuario es JEFE_EQUIPO de algún equipo, puede ver a todos (para invitar)
      const isTeamLeader = await prisma.equipoUsuario.findFirst({
        where: { usuarioId: userId, rol: 'JEFE_EQUIPO', estado: 'ACEPTADO' },
      });

      if (!isTeamLeader) {
        // Miembro normal: solo compañeros de equipo
        const myMemberships = await prisma.equipoUsuario.findMany({
          where: { usuarioId: userId, estado: 'ACEPTADO' },
          select: { equipoId: true },
        });
        const myTeamIds = myMemberships.map((m) => m.equipoId);

        where = myTeamIds.length > 0
          ? { equipos: { some: { equipoId: { in: myTeamIds } } } }
          : { id: userId };
      }
      // Si es JEFE_EQUIPO: where = {} → ve todos
    }

    // Búsqueda opcional por nombre o email (?q=)
    const q = (req.query.q || '').trim();
    if (q) {
      where = {
        ...where,
        OR: [
          { nombre: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      };
    }

    const select = {
      id: true,
      nombre: true,
      email: true,
      descripcion: true,
      imagenPerfil: true,
      rol: true,
    };

    // Compatibilidad: solo paginamos si llega ?page. Sin él, devolvemos el array
    // completo de siempre (lo usan selects/desplegables que necesitan todos los usuarios).
    if (req.query.page !== undefined || req.query.limit !== undefined) {
      const { page, limit, skip } = getPageParams(req, { defaultLimit: 20 });
      const [items, total] = await Promise.all([
        prisma.usuario.findMany({ where, select, orderBy: { nombre: 'asc' }, skip, take: limit }),
        prisma.usuario.count({ where }),
      ]);
      return res.json({ items, ...buildMeta({ page, limit, total }) });
    }

    const users = await prisma.usuario.findMany({ where, select, orderBy: { nombre: 'asc' } });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.usuario.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        nombre: true,
        email: true,
        descripcion: true,
        imagenPerfil: true,
        rolId: true,
        rol: true,
        equipos: {
          where: { estado: 'ACEPTADO' },
          include: {
            equipo: {
              include: {
                _count: { select: { usuarios: true, proyectos: true } },
              },
            },
          },
        },
      },
    });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el usuario' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Evitar que actualicen la contraseña por este endpoint directamente
    delete data.password;

    const user = await prisma.usuario.update({
      where: { id: parseInt(id) },
      data
    });

    res.json({ message: 'Usuario actualizado', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.usuario.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se proporcionó imagen' });
    const { id } = req.params;
    const imagenPerfil = `/uploads/${req.file.filename}`;
    const user = await prisma.usuario.update({
      where: { id: parseInt(id) },
      data: { imagenPerfil },
      select: { id: true, nombre: true, email: true, imagenPerfil: true, rolId: true },
    });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al subir la imagen de perfil' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    if (newPassword.length < 6)
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });

    const user = await prisma.usuario.findUnique({ where: { id: parseInt(id) } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ error: 'La contraseña actual es incorrecta' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.usuario.update({ where: { id: parseInt(id) }, data: { password: hashed } });

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar la contraseña' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  uploadAvatar,
  changePassword,
};
