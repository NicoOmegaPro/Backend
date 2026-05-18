const { fakerES: faker } = require('@faker-js/faker');

async function createRandomTasks(prisma, proyectos, users, countPorProyecto, sprints = []) {
  const estados = ['PENDIENTE', 'EN_PROGRESO', 'EN_REVISION', 'FINALIZADO'];
  const prioridades = ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'];
  const tareas = [];

  for (const proyecto of proyectos) {
    for (let i = 0; i < countPorProyecto; i++) {
      const asignado = faker.helpers.arrayElement(users);
      const sprint = faker.helpers.arrayElement(sprints.filter(s => s.proyectoId === proyecto.id));

      const tarea = await prisma.tarea.create({
        data: {
          titulo: faker.hacker.phrase(),
          descripcion: faker.lorem.sentences(2),
          estado: faker.helpers.arrayElement(estados),
          prioridad: faker.helpers.arrayElement(prioridades),
          proyectoId: proyecto.id,
          sprintId: sprint ? sprint.id : null,
          asignadoAId: asignado ? asignado.id : null
        }
      });
      tareas.push(tarea);
    }
  }
  return tareas;
}

module.exports = { createRandomTasks };