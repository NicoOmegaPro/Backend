const { fakerES: faker } = require('@faker-js/faker');

async function createRandomAdjuntos(prisma, tareas, users, countPorTarea) {
  const adjuntos = [];

  for (const tarea of tareas) {
    for (let i = 0; i < countPorTarea; i++) {
      const usuario = faker.helpers.arrayElement(users);
      const adjunto = await prisma.adjunto.create({
        data: {
          rutaLocal: `/uploads/${faker.system.fileName()}`,
          nombre: faker.lorem.words(2),
          tareaId: tarea.id,
          subidoPor: usuario ? usuario.id : null
        }
      });
      adjuntos.push(adjunto);
    }
  }

  return adjuntos;
}

module.exports = { createRandomAdjuntos };