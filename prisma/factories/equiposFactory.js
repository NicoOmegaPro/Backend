const { fakerES: faker } = require('@faker-js/faker');

async function createRandomEquipos(prisma, users, count) {
  const equipos = [];

  // Roles de equipo: el 1º JEFE_EQUIPO, ~1 de cada 4 SUPERVISOR, el resto MIEMBRO.
  const rolPorIndice = (idx) => {
    if (idx === 0) return 'JEFE_EQUIPO';
    return faker.helpers.arrayElement(['SUPERVISOR', 'MIEMBRO', 'MIEMBRO', 'MIEMBRO']);
  };

  for (let i = 0; i < count; i++) {
    const equipo = await prisma.equipo.create({
      data: {
        nombre: `${faker.word.adjective({ length: { min: 5, max: 10 } })} Team ${i + 1}`,
        descripcion: faker.lorem.sentence(),
        imagen: `https://picsum.photos/seed/team${i + 1}/200/200` // imagen de equipo (URL externa)
      }
    });

    // Asignar entre 4 y 8 miembros únicos con sus roles de equipo.
    const num = faker.number.int({ min: 4, max: 8 });
    const miembros = faker.helpers.arrayElements(users, Math.min(num, users.length));
    const jefe = miembros[0];

    await prisma.equipoUsuario.createMany({
      data: miembros.map((u, idx) => ({
        equipoId: equipo.id,
        usuarioId: u.id,
        rol: rolPorIndice(idx),
        estado: 'ACEPTADO'
      })),
      skipDuplicates: true
    });

    // Devolvemos el equipo enriquecido para que projects/tasks reutilicen sus miembros.
    equipos.push({ ...equipo, miembros, jefe });
  }

  return equipos;
}

module.exports = { createRandomEquipos };
