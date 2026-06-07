const { fakerES: faker } = require('@faker-js/faker');
const bcrypt = require('bcrypt');

async function createRandomUsers(prisma, count) {
  const password = await bcrypt.hash('password123', 10);
  const users = [];

  for (let i = 0; i < count; i++) {
    // Inyectamos el índice en el local-part para garantizar emails únicos (campo @unique).
    const email = faker.internet.email().toLowerCase().replace('@', `${i}@`);
    const user = await prisma.usuario.create({
      data: {
        nombre: faker.person.fullName(),
        email,
        password: password,
        descripcion: faker.person.bio(),
        imagenPerfil: faker.image.avatar(), // foto de retrato (URL absoluta en CDN)
        esAdmin: false // el único admin es la cuenta del seeder; los roles van por equipo
      }
    });
    users.push(user);
  }
  return users;
}

module.exports = { createRandomUsers };