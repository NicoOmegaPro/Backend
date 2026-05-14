import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    register(data: any): Promise<{
        access_token: string;
        user: {
            id: number;
            nombre: string;
            email: string;
            rolId: number;
        };
    }>;
    login(userDto: any): Promise<{
        access_token: string;
        user: {
            id: number;
            nombre: string;
            email: string;
            rolId: number;
        };
    }>;
}
