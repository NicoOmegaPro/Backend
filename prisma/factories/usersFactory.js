const { fakerES: faker } = require('@faker-js/faker');
const bcrypt = require('bcrypt');

async function createRandomUsers(prisma, count) {
  const password = await bcrypt.hash('password123', 10);
  const users = [];

  for (let i = 0; i < count; i++) {
    const email = faker.internet.email().toLowerCase().replace('@', `${i}@`);
    const user = await prisma.usuario.create({
      data: {
        nombre: faker.person.fullName(),
        email,
        password: password,
        descripcion: faker.person.bio(),
        imagenPerfil: faker.image.avatar(),
        esAdmin: false
      }
    });
    users.push(user);
  }
  return users;
}

module.exports = { createRandomUsers };