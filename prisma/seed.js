const { PrismaClient } = require('@prisma/client');

// Importamos los Seeders (Datos Manuales)
const { runRolesSeeder } = require('./seeders/rolesSeeder');
const { runUsersSeeder } = require('./seeders/usersSeeder');
const { runTasksSeeder } = require('./seeders/tasksSeeder');

// Importamos los Factories (Datos Aleatorios)
const { createRandomUsers } = require('./factories/usersFactory');
const { createRandomTasks } = require('./factories/tasksFactory');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando Database Seeding...');

  // 1. Roles
  await runRolesSeeder(prisma);

  // 2. Seeders Manuales
  const manualUsers = await runUsersSeeder(prisma);

  // 3. Factories Aleatorios de Usuarios
  console.log('Ejecutando UsersFactory...');
  const randomUsers = await createRandomUsers(prisma, 100);
  console.log(`${randomUsers.length} usuarios aleatorios creados`);

  // Juntamos todos los usuarios para usarlos en las tareas
  const allUsers = [...manualUsers, ...randomUsers];

  // 4. Seeders Manuales de Tareas/Proyectos
  const { manualProyecto } = await runTasksSeeder(prisma, allUsers);

  // 5. Factories Aleatorios de Tareas
  console.log('Ejecutando TasksFactory...');
  const randomTasks = await createRandomTasks(prisma, [manualProyecto], allUsers, 5);
  console.log(`${randomTasks.length} tareas aleatorias creadas`);

  console.log('¡Database Seeding completado con éxito!');
}

main()
  .catch((e) => {
    console.error('Error general en el seeder:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });