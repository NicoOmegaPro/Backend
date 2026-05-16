const ROLES = {
  ADMINISTRADOR: 1,
  JEFE_PROYECTO: 2,
  SUPERVISOR: 3,
  TRABAJADOR: 4
};

async function runRolesSeeder(prisma) {
  console.log('Ejecutando RolesSeeder...');

  const roles = [
    { id: ROLES.ADMINISTRADOR, nombre: 'ADMINISTRADOR', descripcion: 'Control total' },
    { id: ROLES.JEFE_PROYECTO, nombre: 'JEFE_PROYECTO', descripcion: 'Gestiona proyectos' },
    { id: ROLES.SUPERVISOR, nombre: 'SUPERVISOR', descripcion: 'Solo lectura' },
    { id: ROLES.TRABAJADOR, nombre: 'TRABAJADOR', descripcion: 'Usuario normal' },
  ];

  for (const rol of roles) {
    await prisma.rol.upsert({ where: { id: rol.id }, update: {}, create: rol });
  }

  console.log('Roles base creados');
}

module.exports = { runRolesSeeder, ROLES };