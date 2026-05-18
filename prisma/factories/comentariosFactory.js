const { fakerES: faker } = require('@faker-js/faker');

async function createRandomComentarios(prisma, tareas, users, countPorTarea) {
  const comentarios = [];

  for (const tarea of tareas) {
    for (let i = 0; i < countPorTarea; i++) {
      const autor = faker.helpers.arrayElement(users);
      const comentario = await prisma.comentario.create({
        data: {
          contenido: faker.hacker.phrase(),
          tareaId: tarea.id,
          autorId: autor ? autor.id : null
        }
      });
      comentarios.push(comentario);
    }
  }

  return comentarios;
}

module.exports = { createRandomComentarios };