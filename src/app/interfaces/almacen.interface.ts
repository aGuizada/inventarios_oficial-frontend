import { Sucursal } from './sucursal.interface';

export interface Almacen {
    id: number;
    nombre_almacen: string;
    ubicacion: string;
    sucursal_id: number;
    telefono?: string;
    estado: boolean;
    created_at?: string;
    updated_at?: string;
    sucursal?: Sucursal;
}
