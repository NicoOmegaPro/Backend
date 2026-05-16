const prisma = require('../prisma');

const getAllRoles = async (req, res) => {
  try {
    const roles = await prisma.rol.findMany();
    res.json(roles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener roles' });
  }
};

const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await prisma.rol.findUnique({ where: { id: parseInt(id) } });
    if (!role) return res.status(404).json({ error: 'Rol no encontrado' });
    res.json(role);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el rol' });
  }
};

const createRole = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    const newRole = await prisma.rol.create({
      data: { nombre, descripcion }
    });
    res.status(201).json({ message: 'Rol creado', role: newRole });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear rol' });
  }
};

const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    const role = await prisma.rol.update({
      where: { id: parseInt(id) },
      data: { nombre, descripcion }
    });
    res.json({ message: 'Rol actualizado', role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el rol' });
  }
};

const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.rol.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Rol eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el rol. Verifica que no tenga usuarios asignados.' });
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole
};
