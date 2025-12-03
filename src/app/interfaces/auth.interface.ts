import { User } from './user.interface';

export interface LoginRequest {
    usuario: string;
    password: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    rol_id: number;
    sucursal_id: number;
}

export interface AuthResponse {
    user: User;
    access_token: string;
    token_type: string;
}
