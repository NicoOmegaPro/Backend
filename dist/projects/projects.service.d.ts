import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class ProjectsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createProjectDto: CreateProjectDto): import("@prisma/client").Prisma.Prisma__ProyectoClient<{
        id: number;
        nombre: string;
        descripcion: string | null;
        estado: string;
        equipoId: number | null;
        liderId: number | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(): import("@prisma/client").Prisma.PrismaPromise<({
        equipo: {
            id: number;
            nombre: string;
            descripcion: string | null;
        } | null;
        lider: {
            id: number;
            email: string;
            nombre: string;
            password: string;
            descripcion: string | null;
            imagenPerfil: string | null;
            rolId: number;
        } | null;
    } & {
        id: number;
        nombre: string;
        descripcion: string | null;
        estado: string;
        equipoId: number | null;
        liderId: number | null;
    })[]>;
    findOne(id: number): import("@prisma/client").Prisma.Prisma__ProyectoClient<({
        tareas: {
            id: number;
            descripcion: string | null;
            estado: string;
            titulo: string;
            prioridad: string;
            proyectoId: number;
            sprintId: number | null;
            asignadoAId: number | null;
        }[];
        sprints: {
            id: number;
            nombre: string;
            proyectoId: number;
            fechaInicio: Date;
            fechaFin: Date;
        }[];
    } & {
        id: number;
        nombre: string;
        descripcion: string | null;
        estado: string;
        equipoId: number | null;
        liderId: number | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    update(id: number, updateProjectDto: UpdateProjectDto): import("@prisma/client").Prisma.Prisma__ProyectoClient<{
        id: number;
        nombre: string;
        descripcion: string | null;
        estado: string;
        equipoId: number | null;
        liderId: number | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: number): import("@prisma/client").Prisma.Prisma__ProyectoClient<{
        id: number;
        nombre: string;
        descripcion: string | null;
        estado: string;
        equipoId: number | null;
        liderId: number | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
