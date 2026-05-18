const { fakerES: faker } = require('@faker-js/faker');

async function createRandomSprints(prisma, proyectos, countPorProyecto) {
  const sprints = [];
  const now = new Date();

  for (const proyecto of proyectos) {
    for (let i = 0; i < countPorProyecto; i++) {
      const inicio = new Date(now.getTime() + faker.number.int({ min: 1, max: 30 }) * 24 * 60 * 60 * 1000);
      const fin = new Date(inicio.getTime() + faker.number.int({ min: 7, max: 21 }) * 24 * 60 * 60 * 1000);

      const sprint = await prisma.sprint.create({
        data: {
          nombre: `Sprint ${i + 1} ${proyecto.nombre}`,
          fechaInicio: inicio,
          fechaFin: fin,
          proyectoId: proyecto.id
        }
      });
      sprints.push(sprint);
    }
  }

  return sprints;
}

module.exports = { createRandomSprints };