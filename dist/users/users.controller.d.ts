import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class UsersController {
    private readonly usersService;
    private readonly prisma;
    constructor(usersService: UsersService, prisma: PrismaService);
    findAll(): Promise<{
        rol: {
            id: number;
            nombre: string;
            descripcion: string | null;
        };
        id: number;
        email: string;
        nombre: string;
    }[]>;
}
