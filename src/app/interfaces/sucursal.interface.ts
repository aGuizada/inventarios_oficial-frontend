import { Empresa } from './empresa.interface';

export interface Sucursal {
    id: number;
    nombre: string;
    direccion?: string;
    telefono?: string;
    empresa_id: number;
    created_at: string;
    updated_at: string;
    empresa?: Empresa;
}
