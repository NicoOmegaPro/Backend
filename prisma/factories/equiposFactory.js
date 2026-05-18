const { fakerES: faker } = require('@faker-js/faker');

async function createRandomEquipos(prisma, count) {
  const equipos = [];

  for (let i = 0; i < count; i++) {
    const equipo = await prisma.equipo.create({
      data: {
        nombre: `${faker.word.adjective({ length: { min: 5, max: 10 } })} Team ${i + 1}`,
        descripcion: faker.lorem.sentence()
      }
    });
    equipos.push(equipo);
  }

  return equipos;
}

module.exports = { createRandomEquipos };