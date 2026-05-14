import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.usuario.findUnique({ where: { email } });
  }

  async create(data: any) {
    // Si no hay un rol especificado, buscamos o creamos el rol por defecto (ej. TRABAJADOR)
    let rolId = data.rolId;
    if (!rolId) {
      let rol = await this.prisma.rol.findUnique({ where: { nombre: 'TRABAJADOR' } });
      if (!rol) {
        rol = await this.prisma.rol.create({ data: { nombre: 'TRABAJADOR', descripcion: 'Rol por defecto' } });
      }
      rolId = rol.id;
    }

    return this.prisma.usuario.create({
      data: {
        nombre: data.nombre,
        email: data.email,
        password: data.password,
        rolId: rolId,
      },
    });
  }
}
