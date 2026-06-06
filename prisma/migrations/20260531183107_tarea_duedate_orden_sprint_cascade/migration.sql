-- DropForeignKey
ALTER TABLE "Adjunto" DROP CONSTRAINT "Adjunto_tareaId_fkey";

-- DropForeignKey
ALTER TABLE "Comentario" DROP CONSTRAINT "Comentario_tareaId_fkey";

-- DropForeignKey
ALTER TABLE "Sprint" DROP CONSTRAINT "Sprint_proyectoId_fkey";

-- DropForeignKey
ALTER TABLE "Subtarea" DROP CONSTRAINT "Subtarea_tareaId_fkey";

-- DropForeignKey
ALTER TABLE "Tarea" DROP CONSTRAINT "Tarea_proyectoId_fkey";

-- DropForeignKey
ALTER TABLE "TareaEtiqueta" DROP CONSTRAINT "TareaEtiqueta_etiquetaId_fkey";

-- DropForeignKey
ALTER TABLE "TareaEtiqueta" DROP CONSTRAINT "TareaEtiqueta_tareaId_fkey";

-- AlterTable
ALTER TABLE "Proyecto" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Sprint" ADD COLUMN     "estado" TEXT NOT NULL DEFAULT 'PLANIFICADO',
ADD COLUMN     "objetivo" TEXT;

-- AlterTable
ALTER TABLE "Tarea" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "fechaVencimiento" TIMESTAMP(3),
ADD COLUMN     "orden" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "Sprint" ADD CONSTRAINT "Sprint_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subtarea" ADD CONSTRAINT "Subtarea_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "Tarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "Tarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adjunto" ADD CONSTRAINT "Adjunto_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "Tarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TareaEtiqueta" ADD CONSTRAINT "TareaEtiqueta_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "Tarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TareaEtiqueta" ADD CONSTRAINT "TareaEtiqueta_etiquetaId_fkey" FOREIGN KEY ("etiquetaId") REFERENCES "Etiqueta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
