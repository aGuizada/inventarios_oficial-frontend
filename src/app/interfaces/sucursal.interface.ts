import { Empresa } from './empresa.interface';

export interface Sucursal {
    id: number;
    empresa_id: number;
    nombre: string;
    codigoSucursal?: string;
    direccion?: string;
    correo?: string;
    telefono?: string;
    departamento?: string;
    estado: boolean | string | number;
    responsable?: string;
    created_at?: string;
    updated_at?: string;
    empresa?: Empresa;
}
