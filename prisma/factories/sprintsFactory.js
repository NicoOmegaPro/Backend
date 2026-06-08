const { fakerES: faker } = require('@faker-js/faker');

async function createRandomSprints(prisma, proyectos, countPorProyecto) {
  const sprints = [];
  const now = new Date();
  const DAY = 24 * 60 * 60 * 1000;

  for (const proyecto of proyectos) {
    for (let i = 0; i < countPorProyecto; i++) {
      let inicio, fin, estado;
      if (i === 0) {
        inicio = new Date(now.getTime() - faker.number.int({ min: 3, max: 10 }) * DAY);
        fin = new Date(now.getTime() + faker.number.int({ min: 7, max: 14 }) * DAY);
        estado = 'ACTIVO';
      } else {
        inicio = new Date(now.getTime() + faker.number.int({ min: 12, max: 30 }) * DAY);
        fin = new Date(inicio.getTime() + faker.number.int({ min: 7, max: 21 }) * DAY);
        estado = 'PLANIFICADO';
      }

      const sprint = await prisma.sprint.create({
        data: {
          nombre: `Sprint ${i + 1} · ${proyecto.nombre}`,
          objetivo: faker.company.catchPhrase(),
          estado,
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
