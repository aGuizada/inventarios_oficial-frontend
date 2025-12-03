import { Rol } from './rol.interface';
import { Sucursal } from './sucursal.interface';

export interface User {
    id: number;
    name: string;
    email: string;
    usuario: string;
    telefono?: string;
    rol_id: number;
    sucursal_id: number;
    estado: boolean | string | number; // Handle potential type mismatch like Caja
    email_verified_at?: string;
    created_at?: string;
    updated_at?: string;
    rol?: Rol;
    sucursal?: Sucursal;
}
