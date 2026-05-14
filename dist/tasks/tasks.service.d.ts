import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class TasksService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createTaskDto: CreateTaskDto): import("@prisma/client").Prisma.Prisma__TareaClient<{
        id: number;
        descripcion: string | null;
        estado: string;
        titulo: string;
        prioridad: string;
        proyectoId: number;
        sprintId: number | null;
        asignadoAId: number | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(): import("@prisma/client").Prisma.PrismaPromise<({
        proyecto: {
            id: number;
            nombre: string;
            descripcion: string | null;
            estado: string;
            equipoId: number | null;
            liderId: number | null;
        };
        asignadoA: {
            id: number;
            email: string;
            nombre: string;
            password: string;
            descripcion: string | null;
            imagenPerfil: string | null;
            rolId: number;
        } | null;
        etiquetas: {
            tareaId: number;
            etiquetaId: number;
        }[];
    } & {
        id: number;
        descripcion: string | null;
        estado: string;
        titulo: string;
        prioridad: string;
        proyectoId: number;
        sprintId: number | null;
        asignadoAId: number | null;
    })[]>;
    findOne(id: number): import("@prisma/client").Prisma.Prisma__TareaClient<({
        comentarios: {
            id: number;
            tareaId: number;
            contenido: string;
            fecha: Date;
            autorId: number;
        }[];
        adjuntos: {
            id: number;
            nombre: string;
            tareaId: number;
            fecha: Date;
            rutaLocal: string;
            subidoPor: number;
        }[];
        subtareas: {
            id: number;
            titulo: string;
            tareaId: number;
            completada: boolean;
        }[];
    } & {
        id: number;
        descripcion: string | null;
        estado: string;
        titulo: string;
        prioridad: string;
        proyectoId: number;
        sprintId: number | null;
        asignadoAId: number | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    update(id: number, updateTaskDto: UpdateTaskDto): import("@prisma/client").Prisma.Prisma__TareaClient<{
        id: number;
        descripcion: string | null;
        estado: string;
        titulo: string;
        prioridad: string;
        proyectoId: number;
        sprintId: number | null;
        asignadoAId: number | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: number): import("@prisma/client").Prisma.Prisma__TareaClient<{
        id: number;
        descripcion: string | null;
        estado: string;
        titulo: string;
        prioridad: string;
        proyectoId: number;
        sprintId: number | null;
        asignadoAId: number | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
