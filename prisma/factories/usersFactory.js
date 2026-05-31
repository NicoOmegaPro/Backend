const { fakerES: faker } = require('@faker-js/faker');
const bcrypt = require('bcrypt');

async function createRandomUsers(prisma, count) {
  const password = await bcrypt.hash('password123', 10);
  const users = [];

  for (let i = 0; i < count; i++) {
    const user = await prisma.usuario.create({
      data: {
        nombre: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        password: password,
        descripcion: faker.person.bio(),
        // Sin rol global: los roles son por equipo (JEFE_EQUIPO/MIEMBRO) y por
        // proyecto (JEFE_PROYECTO/SUPERVISOR/TRABAJADOR). El único rol global es
        // Administrador, y solo lo tiene la cuenta admin del seeder.
        rolId: null
      }
    });
    users.push(user);
  }
  return users;
}

module.exports = { createRandomUsers };