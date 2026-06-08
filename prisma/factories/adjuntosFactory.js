const { fakerES: faker } = require('@faker-js/faker');

const PICSUM_SEEDS = [
  'mountain', 'city', 'nature', 'architecture', 'tech', 'abstract',
  'office', 'team', 'code', 'design', 'data', 'cloud', 'mobile', 'web',
  'server', 'network', 'security', 'agile', 'kanban', 'sprint',
  'product', 'startup', 'innovation', 'creative', 'workflow',
];

let seedIndex = 0;

async function createRandomAdjuntos(prisma, tareas, users, countPorTarea) {
  const adjuntos = [];

  for (const tarea of tareas) {
    for (let i = 0; i < countPorTarea; i++) {
      const usuario = faker.helpers.arrayElement(users);
      const seed = PICSUM_SEEDS[seedIndex % PICSUM_SEEDS.length];
      seedIndex++;
      const width = faker.helpers.arrayElement([400, 600, 800]);
      const height = faker.helpers.arrayElement([300, 400]);
      const imageUrl = `https://picsum.photos/seed/${seed}/${width}/${height}`;
      const nombre = `${seed}-${width}x${height}.jpg`;

      const adjunto = await prisma.adjunto.create({
        data: {
          rutaLocal: imageUrl,
          nombre,
          tareaId: tarea.id,
          subidoPor: usuario ? usuario.id : null,
        },
      });
      adjuntos.push(adjunto);
    }
  }

  return adjuntos;
}

module.exports = { createRandomAdjuntos };