const bcrypt = require('bcrypt');

async function runUsersSeeder(prisma) {
  console.log('Ejecutando UsersSeeder...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@admin.com' },
    update: { esAdmin: true },
    create: {
      nombre: 'Super Administrador',
      email: 'admin@admin.com',
      password: adminPassword,
      esAdmin: true
    }
  });

  console.log('Admin manual creado (admin@admin.com / admin123)');

  return [admin];
}

module.exports = { runUsersSeeder };