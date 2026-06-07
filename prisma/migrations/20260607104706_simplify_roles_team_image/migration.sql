/*
  Warnings:

  - You are about to drop the column `rolId` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the `ProyectoUsuario` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Rol` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProyectoUsuario" DROP CONSTRAINT "ProyectoUsuario_proyectoId_fkey";

-- DropForeignKey
ALTER TABLE "ProyectoUsuario" DROP CONSTRAINT "ProyectoUsuario_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "Usuario" DROP CONSTRAINT "Usuario_rolId_fkey";

-- AlterTable
ALTER TABLE "Equipo" ADD COLUMN     "imagen" TEXT;

-- AlterTable
ALTER TABLE "Usuario" DROP COLUMN "rolId",
ADD COLUMN     "esAdmin" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "ProyectoUsuario";

-- DropTable
DROP TABLE "Rol";
