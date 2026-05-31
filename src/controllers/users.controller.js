const prisma = require('../prisma');

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

    const users = await prisma.usuario.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        email: true,
        descripcion: true,
        rol: true,
      },
    });
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
        rol: true
      }
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

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  uploadAvatar,
};
