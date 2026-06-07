const prisma = require('../prisma');
const { registrarActividad } = require('../utils/registrarActividad');
const { esJefeDeEquipo, rolEnProyecto } = require('../utils/permissions');

// Miembros de un proyecto = miembros aceptados del equipo dueño (un único nivel de rol).
function miembrosDesdeEquipo(equipo) {
  if (!equipo?.usuarios) return [];
  return equipo.usuarios
    .filter((u) => u.estado === 'ACEPTADO')
    .map((u) => ({ usuarioId: u.usuarioId, rol: u.rol, usuario: u.usuario }));
}

const getAllProjects = async (req, res) => {
  try {
    const { userId, esAdmin } = req.user;

    // El admin ve todo; el resto, los proyectos de los equipos a los que pertenece.
    const where = esAdmin
      ? {}
      : { equipo: { usuarios: { some: { usuarioId: userId, estado: 'ACEPTADO' } } } };

    const projects = await prisma.proyecto.findMany({
      where,
      include: {
        lider: { select: { id: true, nombre: true, imagenPerfil: true } },
        equipo: { select: { id: true, nombre: true } },
      },
    });
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener proyectos' });
  }
};

const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, esAdmin } = req.user;

    const project = await prisma.proyecto.findUnique({
      where: { id: parseInt(id) },
      include: {
        lider: { select: { id: true, nombre: true, imagenPerfil: true } },
        equipo: {
          include: {
            usuarios: {
              include: { usuario: { select: { id: true, nombre: true, email: true, imagenPerfil: true } } },
            },
          },
        },
        tareas: {
          include: { asignadoA: { select: { id: true, nombre: true, imagenPerfil: true } } },
          orderBy: [{ orden: 'asc' }, { id: 'asc' }],
        },
        sprints: { orderBy: { fechaInicio: 'desc' } },
      },
    });
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    // req.myProjectRole lo provee requireProjectAccess; si no, se calcula.
    const myProjectRole = req.myProjectRole ?? (await rolEnProyecto(userId, esAdmin, project));

    // Miembros del proyecto derivados del equipo (compatibilidad con el frontend).
    res.json({ ...project, miembros: miembrosDesdeEquipo(project.equipo), myProjectRole });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el proyecto' });
  }
};

const createProject = async (req, res) => {
  try {
    const { userId, esAdmin } = req.user;
    const { nombre, descripcion, equipoId } = req.body;

    if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });
    const equipoIdInt = equipoId ? parseInt(equipoId) : null;
    if (!equipoIdInt) return res.status(400).json({ error: 'Debes seleccionar un equipo' });

    // Solo el jefe del equipo (o el admin) puede crear proyectos para ese equipo.
    if (!esAdmin && !(await esJefeDeEquipo(userId, equipoIdInt))) {
      return res.status(403).json({ error: 'Solo el jefe del equipo puede crear proyectos en él' });
    }

    const project = await prisma.proyecto.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        liderId: userId,
        equipoId: equipoIdInt,
      },
      include: {
        lider: { select: { id: true, nombre: true, imagenPerfil: true } },
        equipo: { select: { id: true, nombre: true } },
      },
    });

    await registrarActividad({
      usuarioId: userId,
      entidadTipo: 'PROYECTO',
      entidadId: project.id,
      accion: 'CREADO',
      detalles: `creó el proyecto «${project.nombre}»`,
    });

    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear proyecto' });
  }
};

const updateProject = async (req, res) => {
  try {
    // Editar/archivar el proyecto: solo el jefe de equipo (o admin).
    if (req.myProjectRole !== 'JEFE_EQUIPO') {
      return res.status(403).json({ error: 'Solo el jefe de equipo puede editar este proyecto' });
    }

    const { nombre, descripcion, estado } = req.body;
    const data = {};
    if (nombre !== undefined) data.nombre = nombre;
    if (descripcion !== undefined) data.descripcion = descripcion;
    if (estado !== undefined) data.estado = estado;

    const updated = await prisma.proyecto.update({ where: { id: req.project.id }, data });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar proyecto' });
  }
};

const deleteProject = async (req, res) => {
  try {
    if (req.myProjectRole !== 'JEFE_EQUIPO') {
      return res.status(403).json({ error: 'Solo el jefe de equipo puede eliminar este proyecto' });
    }

    await prisma.proyecto.delete({ where: { id: req.project.id } });
    res.json({ message: 'Proyecto eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar proyecto' });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
