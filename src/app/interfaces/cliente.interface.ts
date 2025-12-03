export interface Cliente {
    id: number;
    nombre: string;
    tipo_documento?: string;
    num_documento?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    estado: boolean | string | number;
    created_at?: string;
    updated_at?: string;
}
