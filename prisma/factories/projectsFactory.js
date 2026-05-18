const { fakerES: faker } = require('@faker-js/faker');

async function createRandomProjects(prisma, equipos, users, count) {
  const projects = [];

  for (let i = 0; i < count; i++) {
    const lider = faker.helpers.arrayElement(users);
    const equipo = faker.helpers.arrayElement(equipos);
    const project = await prisma.proyecto.create({
      data: {
        nombre: faker.company.name(),
        descripcion: faker.lorem.sentences(2),
        estado: faker.helpers.arrayElement(['ACTIVO', 'COMPLETADO', 'ARCHIVADO']),
        liderId: lider ? lider.id : null,
        equipoId: equipo ? equipo.id : null
      }
    });
    projects.push(project);
  }

  return projects;
}

module.exports = { createRandomProjects };