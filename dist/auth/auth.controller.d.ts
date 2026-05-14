import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(body: any): Promise<{
        access_token: string;
        user: {
            id: number;
            nombre: string;
            email: string;
            rolId: number;
        };
    }>;
    login(body: any): Promise<{
        access_token: string;
        user: {
            id: number;
            nombre: string;
            email: string;
            rolId: number;
        };
    }>;
}
