const { fakerES: faker } = require('@faker-js/faker');

async function createRandomTasks(prisma, proyectos, users, countPorProyecto, sprints = []) {
  const estados = ['PENDIENTE', 'EN_PROGRESO', 'EN_REVISION', 'FINALIZADO'];
  const prioridades = ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'];
  const tareas = [];
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  for (const proyecto of proyectos) {
    // Asignamos a miembros reales del proyecto y a sprints de ese mismo proyecto.
    const projectMembers = proyecto.miembros && proyecto.miembros.length ? proyecto.miembros : users;
    const projectSprints = sprints.filter((s) => s.proyectoId === proyecto.id);

    for (let i = 0; i < countPorProyecto; i++) {
      const asignado = faker.helpers.arrayElement(projectMembers);
      const sprint = projectSprints.length ? faker.helpers.arrayElement(projectSprints) : null;

      // Vencimiento variado: algunas vencidas (-10d), otras próximas o lejanas (+21d).
      const offsetDias = faker.number.int({ min: -10, max: 21 });
      const fechaVencimiento = new Date(now + offsetDias * DAY);

      const tarea = await prisma.tarea.create({
        data: {
          titulo: faker.hacker.phrase(),
          descripcion: faker.lorem.sentences(2),
          estado: faker.helpers.arrayElement(estados),
          prioridad: faker.helpers.arrayElement(prioridades),
          orden: i,
          fechaVencimiento,
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
