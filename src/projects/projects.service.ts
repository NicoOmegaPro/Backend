import { Injectable } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  create(createProjectDto: CreateProjectDto) {
    return this.prisma.proyecto.create({ data: createProjectDto as any });
  }

  findAll() {
    return this.prisma.proyecto.findMany({ include: { equipo: true, lider: true } });
  }

  findOne(id: number) {
    return this.prisma.proyecto.findUnique({ where: { id }, include: { tareas: true, sprints: true } });
  }

  update(id: number, updateProjectDto: UpdateProjectDto) {
    return this.prisma.proyecto.update({ where: { id }, data: updateProjectDto as any });
  }

  remove(id: number) {
    return this.prisma.proyecto.delete({ where: { id } });
  }
}
