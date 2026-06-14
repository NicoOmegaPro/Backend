const prisma = require('../prisma');
const { registrarActividad } = require('../utils/registrarActividad');
const { esJefeDeEquipo, rolEnProyecto } = require('../utils/permissions');

// Miembros del proyecto = unión de los miembros ACEPTADOS de todos sus equipos.
// El rol del proyecto lo marca el equipo dueño; los de equipos invitados son MIEMBRO.
// Si un usuario está en varios equipos, prevalece su rol en el equipo dueño.
function miembrosDesdeProyecto(project) {
  const ownerId = project?.equipoId;
  const map = new Map();
  for (const pe of project?.equipos || []) {
    const esDueno = pe.equipoId === ownerId;
    for (const u of pe.equipo?.usuarios || []) {
      if (u.estado !== 'ACEPTADO') continue;
      if (esDueno || !map.has(u.usuarioId)) {
        map.set(u.usuarioId, {
          usuarioId: u.usuarioId,
          rol: esDueno ? u.rol : 'MIEMBRO',
          equipoId: pe.equipoId,
          usuario: u.usuario,
        });
      }
    }
  }
  return [...map.values()];
}

// Resumen de los equipos del proyecto para el frontend (id, nombre, dueño, nº miembros).
function equiposDesdeProyecto(project) {
  return (project?.equipos || []).map((pe) => ({
    id: pe.equipo.id,
    nombre: pe.equipo.nombre,
    imagen: pe.equipo.imagen,
    esDueno: pe.equipoId === project.equipoId,
    numMiembros: (pe.equipo.usuarios || []).filter((u) => u.estado === 'ACEPTADO').length,
  }));
}

const proyectoConEquiposInclude = {
  lider: { select: { id: true, nombre: true, imagenPerfil: true } },
  equipos: {
    include: {
      equipo: {
        include: {
          usuarios: {
            include: { usuario: { select: { id: true, nombre: true, email: true, imagenPerfil: true } } },
          },
        },
      },
    },
  },
};

const getAllProjects = async (req, res) => {
  try {
    const { userId, esAdmin } = req.user;

    const where = esAdmin
      ? {}
      : { equipos: { some: { equipo: { usuarios: { some: { usuarioId: userId, estado: 'ACEPTADO' } } } } } };

    const projects = await prisma.proyecto.findMany({
      where,
      include: {
        lider: { select: { id: true, nombre: true, imagenPerfil: true } },
        equipo: { select: { id: true, nombre: true } },
        equipos: { include: { equipo: { select: { id: true, nombre: true } } } },
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
        ...proyectoConEquiposInclude,
        tareas: {
          include: { asignadoA: { select: { id: true, nombre: true, imagenPerfil: true } } },
          orderBy: [{ orden: 'asc' }, { id: 'asc' }],
        },
        sprints: { orderBy: { id: 'asc' } },
      },
    });
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    const myProjectRole = req.myProjectRole ?? (await rolEnProyecto(userId, esAdmin, project));

    res.json({
      ...project,
      miembros: miembrosDesdeProyecto(project),
      equipos: equiposDesdeProyecto(project),
      myProjectRole,
    });
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

    if (!esAdmin && !(await esJefeDeEquipo(userId, equipoIdInt))) {
      return res.status(403).json({ error: 'Solo el jefe del equipo puede crear proyectos en él' });
    }

    const project = await prisma.proyecto.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        liderId: userId,
        equipoId: equipoIdInt,
        equipos: { create: { equipoId: equipoIdInt } }, // el equipo dueño también es equipo del proyecto
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

// Búsqueda de equipos que el jefe dueño puede invitar: coincidencias por nombre
// (?q=), excluyendo los que ya están en el proyecto. Resultados limitados para escalar.
const EQUIPOS_BUSQUEDA_LIMITE = 15;
const getEquiposDisponibles = async (req, res) => {
  try {
    if (req.myProjectRole !== 'JEFE_EQUIPO') {
      return res.status(403).json({ error: 'Solo el jefe del equipo dueño puede invitar equipos' });
    }

    const yaVinculados = await prisma.proyectoEquipo.findMany({
      where: { proyectoId: req.project.id },
      select: { equipoId: true },
    });
    const excluidos = yaVinculados.map((pe) => pe.equipoId);

    const q = (req.query.q || '').trim();
    const where = {
      id: { notIn: excluidos },
      ...(q ? { nombre: { contains: q, mode: 'insensitive' } } : {}),
    };

    const equipos = await prisma.equipo.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        imagen: true,
        _count: { select: { usuarios: { where: { estado: 'ACEPTADO' } } } },
      },
      orderBy: { nombre: 'asc' },
      take: EQUIPOS_BUSQUEDA_LIMITE,
    });

    res.json(equipos.map((e) => ({ id: e.id, nombre: e.nombre, imagen: e.imagen, numMiembros: e._count.usuarios })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener equipos disponibles' });
  }
};

// Invita (añade) un equipo colaborador al proyecto.
const addEquipo = async (req, res) => {
  try {
    if (req.myProjectRole !== 'JEFE_EQUIPO') {
      return res.status(403).json({ error: 'Solo el jefe del equipo dueño puede invitar equipos' });
    }

    const equipoId = parseInt(req.body.equipoId);
    if (Number.isNaN(equipoId)) return res.status(400).json({ error: 'Debes indicar un equipo válido' });

    const equipo = await prisma.equipo.findUnique({ where: { id: equipoId }, select: { id: true, nombre: true } });
    if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' });

    const yaExiste = await prisma.proyectoEquipo.findUnique({
      where: { proyectoId_equipoId: { proyectoId: req.project.id, equipoId } },
    });
    if (yaExiste) return res.status(409).json({ error: 'Ese equipo ya participa en el proyecto' });

    await prisma.proyectoEquipo.create({ data: { proyectoId: req.project.id, equipoId } });

    await registrarActividad({
      usuarioId: req.user.userId,
      entidadTipo: 'PROYECTO',
      entidadId: req.project.id,
      accion: 'ACTUALIZADO',
      detalles: `invitó al equipo «${equipo.nombre}» al proyecto «${req.project.nombre}»`,
    });

    res.status(201).json({ message: `Equipo «${equipo.nombre}» añadido al proyecto` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al añadir el equipo al proyecto' });
  }
};

// Quita un equipo colaborador del proyecto (no se puede quitar el equipo dueño).
const removeEquipo = async (req, res) => {
  try {
    if (req.myProjectRole !== 'JEFE_EQUIPO') {
      return res.status(403).json({ error: 'Solo el jefe del equipo dueño puede quitar equipos' });
    }

    const equipoId = parseInt(req.params.equipoId);
    if (Number.isNaN(equipoId)) return res.status(400).json({ error: 'Equipo no válido' });
    if (equipoId === req.project.equipoId) {
      return res.status(400).json({ error: 'No puedes quitar el equipo dueño del proyecto' });
    }

    const vinculo = await prisma.proyectoEquipo.findUnique({
      where: { proyectoId_equipoId: { proyectoId: req.project.id, equipoId } },
    });
    if (!vinculo) return res.status(404).json({ error: 'Ese equipo no participa en el proyecto' });

    await prisma.proyectoEquipo.delete({
      where: { proyectoId_equipoId: { proyectoId: req.project.id, equipoId } },
    });

    res.json({ message: 'Equipo quitado del proyecto' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al quitar el equipo del proyecto' });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getEquiposDisponibles,
  addEquipo,
  removeEquipo,
};
