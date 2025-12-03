import { Rol } from './rol.interface';
import { Sucursal } from './sucursal.interface';

export interface User {
    id: number;
    name: string;
    email: string;
    rol_id: number;
    sucursal_id: number;
    email_verified_at?: string;
    created_at: string;
    updated_at: string;
    rol?: Rol;
    sucursal?: Sucursal;
}
