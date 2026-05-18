async function runEtiquetasSeeder(prisma) {
  console.log('Ejecutando EtiquetasSeeder...');

  const etiquetas = [
    { nombre: 'Bug',           color: '#ef4444' },
    { nombre: 'Feature',       color: '#3b82f6' },
    { nombre: 'Mejora',        color: '#8b5cf6' },
    { nombre: 'Urgente',       color: '#f97316' },
    { nombre: 'Documentación', color: '#6b7280' },
    { nombre: 'Testing',       color: '#10b981' },
    { nombre: 'Diseño',        color: '#ec4899' },
    { nombre: 'Backend',       color: '#0ea5e9' },
    { nombre: 'Frontend',      color: '#f59e0b' },
    { nombre: 'DevOps',        color: '#14b8a6' },
  ];

  const created = [];
  for (const etiqueta of etiquetas) {
    const existe = await prisma.etiqueta.findFirst({ where: { nombre: etiqueta.nombre } });
    if (!existe) {
      const e = await prisma.etiqueta.create({ data: etiqueta });
      created.push(e);
    }
  }

  console.log(`${created.length} etiquetas base creadas`);
  return created;
}

module.exports = { runEtiquetasSeeder };
