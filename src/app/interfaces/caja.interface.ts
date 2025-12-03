import { Sucursal } from './sucursal.interface';

export interface Caja {
    id: number;
    nombre: string;
    descripcion?: string;
    sucursal_id: number;
    estado: string;
    saldo_inicial: number;
    saldo_actual: number;
    created_at: string;
    updated_at: string;
    sucursal?: Sucursal;
}
