const { fakerES: faker } = require('@faker-js/faker');

async function createRandomEtiquetas(prisma, count) {
  const etiquetas = [];

  for (let i = 0; i < count; i++) {
    const etiqueta = await prisma.etiqueta.create({
      data: {
        nombre: faker.word.noun({ length: { min: 4, max: 10 } }).toUpperCase(),
        color: faker.color.rgb({ format: 'hex' })
      }
    });
    etiquetas.push(etiqueta);
  }

  return etiquetas;
}

async function assignEtiquetasToTasks(prisma, tareas, etiquetas, maxPorTarea = 2) {
  const relations = [];

  for (const tarea of tareas) {
    const etiquetasSeleccionadas = faker.helpers.arrayElements(etiquetas, faker.number.int({ min: 1, max: Math.min(maxPorTarea, etiquetas.length) }));
    for (const etiqueta of etiquetasSeleccionadas) {
      const relation = await prisma.tareaEtiqueta.create({
        data: {
          tareaId: tarea.id,
          etiquetaId: etiqueta.id
        }
      });
      relations.push(relation);
    }
  }

  return relations;
}

module.exports = { createRandomEtiquetas, assignEtiquetasToTasks };