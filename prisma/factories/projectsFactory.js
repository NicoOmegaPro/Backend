const { fakerES: faker } = require('@faker-js/faker');

async function createRandomProjects(prisma, equipos, users, count) {
  const projects = [];

  for (let i = 0; i < count; i++) {
    const equipo = faker.helpers.arrayElement(equipos);
    const teamMembers = equipo.miembros && equipo.miembros.length
      ? equipo.miembros
      : faker.helpers.arrayElements(users, 4);
    const lider = equipo.jefe || teamMembers[0];

    const project = await prisma.proyecto.create({
      data: {
        nombre: faker.company.name(),
        descripcion: faker.lorem.sentences(2),
        estado: faker.helpers.arrayElement(['ACTIVO', 'ACTIVO', 'COMPLETADO', 'ARCHIVADO']),
        liderId: lider ? lider.id : null,
        equipoId: equipo.id
      }
    });

    projects.push({ ...project, miembros: teamMembers });
  }

  return projects;
}

module.exports = { createRandomProjects };
