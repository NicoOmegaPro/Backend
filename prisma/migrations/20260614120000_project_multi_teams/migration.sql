-- CreateTable
CREATE TABLE "ProyectoEquipo" (
    "proyectoId" INTEGER NOT NULL,
    "equipoId" INTEGER NOT NULL,

    CONSTRAINT "ProyectoEquipo_pkey" PRIMARY KEY ("proyectoId","equipoId")
);

-- AddForeignKey
ALTER TABLE "ProyectoEquipo" ADD CONSTRAINT "ProyectoEquipo_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProyectoEquipo" ADD CONSTRAINT "ProyectoEquipo_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "Equipo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: cada proyecto existente registra a su equipo dueño como equipo del proyecto
INSERT INTO "ProyectoEquipo" ("proyectoId", "equipoId")
SELECT "id", "equipoId" FROM "Proyecto" WHERE "equipoId" IS NOT NULL;
