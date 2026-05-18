const { fakerES: faker } = require('@faker-js/faker');

async function createRandomSubtareas(prisma, tareas, countPorTarea) {
  const subtareas = [];

  for (const tarea of tareas) {
    for (let i = 0; i < countPorTarea; i++) {
      const subtarea = await prisma.subtarea.create({
        data: {
          titulo: faker.hacker.verb() + ' ' + faker.hacker.noun(),
          completada: faker.datatype.boolean(),
          tareaId: tarea.id
        }
      });
      subtareas.push(subtarea);
    }
  }

  return subtareas;
}

module.exports = { createRandomSubtareas };