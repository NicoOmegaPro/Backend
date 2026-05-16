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
        rolId: faker.number.int({ min: 2, max: 4 })
      }
    });
    users.push(user);
  }
  return users;
}

module.exports = { createRandomUsers };