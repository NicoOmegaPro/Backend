const bcrypt = require('bcrypt');
const { ROLES } = require('./rolesSeeder');

async function runUsersSeeder(prisma) {
  console.log('Ejecutando UsersSeeder...');

  // SEED MANUAL: Crear un Super Admin que siempre exista
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@admin.com' },
    update: {},
    create: {
      nombre: 'Super Administrador',
      email: 'admin@admin.com',
      password: adminPassword,
      rolId: ROLES.ADMINISTRADOR // Usamos el ID exportado desde rolesSeeder
    }
  });

  console.log('Admin manual creado (admin@admin.com / admin123)');

  return [admin];
}

module.exports = { runUsersSeeder };