const { fakerES: faker } = require('@faker-js/faker');

async function createRandomProjects(prisma, equipos, users, count) {
  const projects = [];

  for (let i = 0; i < count; i++) {
    // Elegimos un equipo; su jefe lidera el proyecto y sus miembros lo integran.
    const equipo = faker.helpers.arrayElement(equipos);
    const teamMembers = equipo.miembros && equipo.miembros.length
      ? equipo.miembros
      : faker.helpers.arrayElements(users, 4);
    const lider = equipo.jefe || teamMembers[0];

    const project = await prisma.proyecto.create({
      data: {
        nombre: faker.company.name(),
        descripcion: faker.lorem.sentences(2),
        // Sesgo hacia ACTIVO para que el dashboard tenga proyectos en curso.
        estado: faker.helpers.arrayElement(['ACTIVO', 'ACTIVO', 'COMPLETADO', 'ARCHIVADO']),
        liderId: lider ? lider.id : null,
        equipoId: equipo.id
      }
    });

    // Ya no hay roles por proyecto: los miembros (y sus roles) salen del equipo.
    // Guardamos los miembros del equipo para que tasksFactory asigne tareas a gente real.
    projects.push({ ...project, miembros: teamMembers });
  }

  return projects;
}

module.exports = { createRandomProjects };
