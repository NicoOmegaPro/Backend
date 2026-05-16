async function runTasksSeeder(prisma, users) {
  console.log('Ejecutando TasksSeeder...');

  // SEED MANUAL: Crear un proyecto base manual
  const proyecto = await prisma.proyecto.create({
    data: {
      nombre: 'Proyecto Principal',
      descripcion: 'Proyecto creado manualmente desde el seeder',
      estado: 'ACTIVO'
    }
  });

  // SEED MANUAL: Crear una tarea manual asignada al primer usuario
  await prisma.tarea.create({
    data: {
      titulo: 'Configurar servidor inicial',
      descripcion: 'Tarea súper urgente y manual',
      estado: 'PENDIENTE',
      prioridad: 'URGENTE',
      proyectoId: proyecto.id,
      asignadoAId: users[0] ? users[0].id : null
    }
  });

  console.log('   📌 Proyecto y Tarea manual creados');

  // Devolvemos el proyecto manual para que el Factory lo pueda usar luego
  return { manualProyecto: proyecto };
}

module.exports = { runTasksSeeder };
