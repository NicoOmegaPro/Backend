const { fakerES: faker } = require('@faker-js/faker');

async function createRandomNotificaciones(prisma, users, count) {
  const notificaciones = [];

  for (let i = 0; i < count; i++) {
    const usuario = faker.helpers.arrayElement(users);
    const notificacion = await prisma.notificacion.create({
      data: {
        mensaje: faker.lorem.sentence(),
        tipo: faker.helpers.arrayElement(['NUEVA_TAREA', 'CAMBIO_ESTADO', 'MENSAJE', 'RECORDATORIO']),
        leida: faker.datatype.boolean(),
        usuarioId: usuario ? usuario.id : null
      }
    });
    notificaciones.push(notificacion);
  }

  return notificaciones;
}

module.exports = { createRandomNotificaciones };