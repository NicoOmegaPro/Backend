const prisma = require('../prisma');
const { registrarActividad } = require('../utils/registrarActividad');
const { notificar } = require('../utils/notificar');
const { ROLES_PROYECTO, ROLES_GESTION, esJefeDeEquipo, rolEnProyecto } = require('../utils/permissions');

const getAllProjects = async (req, res) => {
  try {
    const { userId, rolId } = req.user;

    // El admin ve todo; el resto ve los proyectos de sus equipos o en los que participa.
    const where = rolId === 1
      ? {}
      : {
          OR: [
            { equipo: { usuarios: { some: { usuarioId: userId, estado: 'ACEPTADO' } } } },
            { miembros: { some: { usuarioId: userId } } },
          ],
        };

    const projects = await prisma.proyecto.findMany({
      where,
      include: {
        lider: { select: { id: true, nombre: true } },
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
    const { userId, rolId } = req.user;

    const project = await prisma.proyecto.findUnique({
      where: { id: parseInt(id) },
      include: {
        lider: { select: { id: true, nombre: true } },
        equipo: true,
        tareas: {
          include: { asignadoA: { select: { id: true, nombre: true, imagenPerfil: true } } },
          orderBy: [{ orden: 'asc' }, { id: 'asc' }],
        },
        sprints: { orderBy: { fechaInicio: 'desc' } },
        miembros: {
          include: { usuario: { select: { id: true, nombre: true, email: true, imagenPerfil: true } } },
        },
      },
    });
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    // req.myProjectRole lo provee requireProjectAccess; si no, se calcula.
    const myProjectRole = req.myProjectRole ?? (await rolEnProyecto(userId, rolId, project));

    res.json({ ...project, myProjectRole });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el proyecto' });
  }
};

const createProject = async (req, res) => {
  try {
    const { userId, rolId } = req.user;
    const { nombre, descripcion, equipoId, miembros } = req.body;

    if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });
    const equipoIdInt = equipoId ? parseInt(equipoId) : null;
    if (!equipoIdInt) return res.status(400).json({ error: 'Debes seleccionar un equipo' });

    // Solo el jefe del equipo (o el admin) puede crear proyectos para ese equipo.
    if (rolId !== 1 && !(await esJefeDeEquipo(userId, equipoIdInt))) {
      return res.status(403).json({ error: 'Solo el jefe del equipo puede crear proyectos en él' });
    }

    // Miembros del equipo aceptados (para validar a quién se le puede asignar rol).
    const equipoMembers = await prisma.equipoUsuario.findMany({
      where: { equipoId: equipoIdInt, estado: 'ACEPTADO' },
      select: { usuarioId: true },
    });
    const equipoMemberIds = new Set(equipoMembers.map((m) => m.usuarioId));

    // Construir la lista de roles de proyecto. El creador es siempre JEFE_PROYECTO.
    const rolesPorUsuario = new Map();
    rolesPorUsuario.set(userId, 'JEFE_PROYECTO');

    for (const m of Array.isArray(miembros) ? miembros : []) {
      const uid = parseInt(m.usuarioId);
      const rol = ROLES_PROYECTO.includes(m.rol) ? m.rol : 'TRABAJADOR';
      if (!uid || uid === userId) continue;
      if (!equipoMemberIds.has(uid)) continue; // solo miembros del equipo
      rolesPorUsuario.set(uid, rol);
    }

    const project = await prisma.proyecto.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        liderId: userId,
        equipoId: equipoIdInt,
        miembros: {
          create: [...rolesPorUsuario.entries()].map(([usuarioId, rol]) => ({ usuarioId, rol })),
        },
      },
      include: {
        lider: { select: { id: true, nombre: true } },
        miembros: {
          include: { usuario: { select: { id: true, nombre: true, email: true } } },
        },
      },
    });

    await registrarActividad({
      usuarioId: userId,
      entidadTipo: 'PROYECTO',
      entidadId: project.id,
      accion: 'CREADO',
      detalles: `creó el proyecto «${project.nombre}»`,
    });

    // Notificar a los miembros añadidos (excepto al creador).
    for (const [uid] of rolesPorUsuario.entries()) {
      await notificar({
        usuarioId: uid, actorId: userId, tipo: 'NUEVO_PROYECTO',
        mensaje: `Te han añadido al proyecto «${project.nombre}»`,
      });
    }

    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear proyecto' });
  }
};

const updateProject = async (req, res) => {
  try {
    // req.project y req.myProjectRole vienen de requireProjectAccess.
    if (!ROLES_GESTION.includes(req.myProjectRole)) {
      return res.status(403).json({ error: 'No tienes permisos para editar este proyecto' });
    }

    // Solo permitimos editar estos campos por aquí (ya validados por zod).
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
    if (!ROLES_GESTION.includes(req.myProjectRole)) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar este proyecto' });
    }

    await prisma.proyecto.delete({ where: { id: req.project.id } });
    res.json({ message: 'Proyecto eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar proyecto' });
  }
};

/* ── Gestión de miembros del proyecto (solo jefe de equipo / jefe de proyecto) ── */

// req.project / req.myProjectRole los provee requireProjectAccess. Devuelve true si puede gestionar.
function ensureCanManageMembers(req, res) {
  if (!ROLES_GESTION.includes(req.myProjectRole)) {
    res.status(403).json({ error: 'Solo el jefe de equipo o el jefe de proyecto pueden gestionar miembros' });
    return false;
  }
  return true;
}

// POST /projects/:id/miembros  { usuarioId, rol }
const addProjectMember = async (req, res) => {
  try {
    const projectId = req.project.id;
    const project = req.project;
    if (!ensureCanManageMembers(req, res)) return;

    const usuarioId = parseInt(req.body.usuarioId);
    const rol = ROLES_PROYECTO.includes(req.body.rol) ? req.body.rol : 'TRABAJADOR';
    if (!usuarioId) return res.status(400).json({ error: 'Falta el usuario' });

    // El usuario debe pertenecer al equipo del proyecto.
    if (!(await esJefeDeEquipo(usuarioId, project.equipoId))) {
      const mem = await prisma.equipoUsuario.findUnique({
        where: { usuarioId_equipoId: { usuarioId, equipoId: project.equipoId } },
      });
      if (!mem || mem.estado !== 'ACEPTADO') {
        return res.status(400).json({ error: 'El usuario no es miembro del equipo del proyecto' });
      }
    }

    const result = await prisma.proyectoUsuario.upsert({
      where: { proyectoId_usuarioId: { proyectoId: projectId, usuarioId } },
      update: { rol },
      create: { proyectoId: projectId, usuarioId, rol },
    });

    const nuevoMiembro = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { nombre: true },
    });
    await registrarActividad({
      usuarioId: req.user.userId,
      entidadTipo: 'PROYECTO',
      entidadId: projectId,
      accion: 'ACTUALIZADO',
      detalles: `añadió a ${nuevoMiembro?.nombre || 'un miembro'} al proyecto «${project.nombre}»`,
    });

    await notificar({
      usuarioId, actorId: req.user.userId, tipo: 'NUEVO_PROYECTO',
      mensaje: `Te han añadido al proyecto «${project.nombre}»`,
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al añadir miembro al proyecto' });
  }
};

// PUT /projects/:id/miembros/:userId  { rol }
const updateProjectMember = async (req, res) => {
  try {
    const projectId = req.project.id;
    if (!ensureCanManageMembers(req, res)) return;

    const targetUserId = parseInt(req.params.userId);
    const rol = req.body.rol;
    if (!ROLES_PROYECTO.includes(rol)) {
      return res.status(400).json({ error: 'Rol no válido. Usa: JEFE_PROYECTO, SUPERVISOR, TRABAJADOR' });
    }

    const existing = await prisma.proyectoUsuario.findUnique({
      where: { proyectoId_usuarioId: { proyectoId: projectId, usuarioId: targetUserId } },
    });
    if (!existing) return res.status(404).json({ error: 'El usuario no participa en el proyecto' });

    const result = await prisma.proyectoUsuario.update({
      where: { proyectoId_usuarioId: { proyectoId: projectId, usuarioId: targetUserId } },
      data: { rol },
    });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el rol del miembro' });
  }
};

// DELETE /projects/:id/miembros/:userId
const removeProjectMember = async (req, res) => {
  try {
    const projectId = req.project.id;
    const project = req.project;
    if (!ensureCanManageMembers(req, res)) return;

    const targetUserId = parseInt(req.params.userId);
    if (targetUserId === project.liderId) {
      return res.status(400).json({ error: 'No puedes quitar al jefe de proyecto' });
    }

    await prisma.proyectoUsuario.deleteMany({
      where: { proyectoId: projectId, usuarioId: targetUserId },
    });
    res.json({ message: 'Miembro eliminado del proyecto' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar miembro del proyecto' });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addProjectMember,
  updateProjectMember,
  removeProjectMember,
};
