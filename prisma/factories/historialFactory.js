const { fakerES: faker } = require('@faker-js/faker');

async function createRandomHistorial(prisma, users, count) {
  const acciones = ['CREADO', 'ACTUALIZADO', 'ELIMINADO'];
  const tipos = ['TAREA', 'PROYECTO', 'USUARIO', 'ROL', 'SPRINT', 'EQUIPO'];
  const historial = [];

  for (let i = 0; i < count; i++) {
    const usuario = faker.helpers.arrayElement(users);
    const registro = await prisma.historialActividad.create({
      data: {
        entidadTipo: faker.helpers.arrayElement(tipos),
        entidadId: faker.number.int({ min: 1, max: 30 }),
        accion: faker.helpers.arrayElement(acciones),
        detalles: faker.lorem.sentence(),
        usuarioId: usuario ? usuario.id : null
      }
    });
    historial.push(registro);
  }

  return historial;
}

module.exports = { createRandomHistorial };