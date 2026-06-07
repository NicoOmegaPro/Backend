const { PrismaClient } = require('@prisma/client');

// Importamos los Seeders (Datos Manuales)
const { runUsersSeeder } = require('./seeders/usersSeeder');

// Importamos los Factories (Datos Aleatorios)
const { createRandomUsers } = require('./factories/usersFactory');
const { createRandomEquipos } = require('./factories/equiposFactory');
const { createRandomProjects } = require('./factories/projectsFactory');
const { createRandomSprints } = require('./factories/sprintsFactory');
const { createRandomTasks } = require('./factories/tasksFactory');
const { createRandomSubtareas } = require('./factories/subtareasFactory');
const { createRandomComentarios } = require('./factories/comentariosFactory');
const { createRandomAdjuntos } = require('./factories/adjuntosFactory');
const { runEtiquetasSeeder } = require('./seeders/etiquetasSeeder');
const { assignEtiquetasToTasks } = require('./factories/etiquetasFactory');
const { createRandomNotificaciones } = require('./factories/notificacionesFactory');
const { createRandomHistorial } = require('./factories/historialFactory');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando Database Seeding...');

  // 1. Admin global (seeder manual)
  const manualUsers = await runUsersSeeder(prisma);

  // 3. Factories Aleatorios de Usuarios
  console.log('Ejecutando UsersFactory...');
  const randomUsers = await createRandomUsers(prisma, 150);
  console.log(`${randomUsers.length} usuarios aleatorios creados`);

  const allUsers = [...manualUsers, ...randomUsers];

  // 4. Equipo y proyectos aleatorios
  console.log('Ejecutando EquiposFactory...');
  const equipos = await createRandomEquipos(prisma, allUsers, 16);
  console.log(`${equipos.length} equipos aleatorios creados`);

  console.log('Ejecutando ProjectsFactory...');
  const proyectos = await createRandomProjects(prisma, equipos, allUsers, 25);
  console.log(`${proyectos.length} proyectos aleatorios creados`);

  // 5. Sprints aleatorios
  console.log('Ejecutando SprintsFactory...');
  const sprints = await createRandomSprints(prisma, proyectos, 3);
  console.log(`${sprints.length} sprints aleatorios creados`);

  // 6. Tareas aleatorias
  console.log('Ejecutando TasksFactory...');
  const randomTasks = await createRandomTasks(prisma, proyectos, allUsers, 12, sprints);
  console.log(`${randomTasks.length} tareas aleatorias creadas`);

  // 7. Subtareas, comentarios y adjuntos
  console.log('Ejecutando SubtareasFactory...');
  const subtareas = await createRandomSubtareas(prisma, randomTasks, 3);
  console.log(`${subtareas.length} subtareas aleatorias creadas`);

  console.log('Ejecutando ComentariosFactory...');
  const comentarios = await createRandomComentarios(prisma, randomTasks, allUsers, 2);
  console.log(`${comentarios.length} comentarios aleatorios creados`);

  console.log('Ejecutando AdjuntosFactory...');
  const adjuntos = await createRandomAdjuntos(prisma, randomTasks, allUsers, 1);
  console.log(`${adjuntos.length} adjuntos aleatorios creados`);

  // 8. Etiquetas (seeder fijo) y asignación a tareas
  const etiquetas = await runEtiquetasSeeder(prisma);

  const etiquetaRelations = await assignEtiquetasToTasks(prisma, randomTasks, etiquetas, 2);
  console.log(`${etiquetaRelations.length} relaciones tarea-etiqueta creadas`);

  // 9. Notificaciones e historial
  console.log('Ejecutando NotificacionesFactory...');
  const notificaciones = await createRandomNotificaciones(prisma, allUsers, 80);
  console.log(`${notificaciones.length} notificaciones aleatorias creadas`);

  console.log('Ejecutando HistorialFactory...');
  const historial = await createRandomHistorial(prisma, allUsers, 80);
  console.log(`${historial.length} registros de historial aleatorios creados`);

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