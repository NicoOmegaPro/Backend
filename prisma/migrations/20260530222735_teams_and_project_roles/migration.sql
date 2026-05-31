-- DropForeignKey
ALTER TABLE "EquipoUsuario" DROP CONSTRAINT "EquipoUsuario_equipoId_fkey";

-- DropForeignKey
ALTER TABLE "EquipoUsuario" DROP CONSTRAINT "EquipoUsuario_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "Usuario" DROP CONSTRAINT "Usuario_rolId_fkey";

-- AlterTable
ALTER TABLE "EquipoUsuario" ADD COLUMN     "estado" TEXT NOT NULL DEFAULT 'ACEPTADO',
ADD COLUMN     "rol" TEXT NOT NULL DEFAULT 'MIEMBRO';

-- AlterTable
ALTER TABLE "Usuario" ALTER COLUMN "rolId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ProyectoUsuario" (
    "proyectoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'TRABAJADOR',

    CONSTRAINT "ProyectoUsuario_pkey" PRIMARY KEY ("proyectoId","usuarioId")
);

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Rol"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipoUsuario" ADD CONSTRAINT "EquipoUsuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipoUsuario" ADD CONSTRAINT "EquipoUsuario_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "Equipo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProyectoUsuario" ADD CONSTRAINT "ProyectoUsuario_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProyectoUsuario" ADD CONSTRAINT "ProyectoUsuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
