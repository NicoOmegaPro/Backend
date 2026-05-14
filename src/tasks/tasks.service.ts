import { Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  create(createTaskDto: CreateTaskDto) {
    return this.prisma.tarea.create({ data: createTaskDto as any });
  }

  findAll() {
    return this.prisma.tarea.findMany({ include: { asignadoA: true, proyecto: true, etiquetas: true } });
  }

  findOne(id: number) {
    return this.prisma.tarea.findUnique({ where: { id }, include: { subtareas: true, comentarios: true, adjuntos: true } });
  }

  update(id: number, updateTaskDto: UpdateTaskDto) {
    return this.prisma.tarea.update({ where: { id }, data: updateTaskDto as any });
  }

  remove(id: number) {
    return this.prisma.tarea.delete({ where: { id } });
  }
}
