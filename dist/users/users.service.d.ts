import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findByEmail(email: string): Promise<{
        id: number;
        email: string;
        nombre: string;
        password: string;
        descripcion: string | null;
        imagenPerfil: string | null;
        rolId: number;
    } | null>;
    create(data: any): Promise<{
        id: number;
        email: string;
        nombre: string;
        password: string;
        descripcion: string | null;
        imagenPerfil: string | null;
        rolId: number;
    }>;
}
