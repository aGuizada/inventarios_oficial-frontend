import { Sucursal } from './sucursal.interface';

export interface Almacen {
    id: number;
    nombre: string;
    descripcion?: string;
    ubicacion?: string;
    sucursal_id: number;
    created_at: string;
    updated_at: string;
    sucursal?: Sucursal;
}
