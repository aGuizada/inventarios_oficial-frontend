export interface Proveedor {
    id: number;
    nombre: string;
    tipo_documento?: string;
    num_documento?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    estado: boolean;
    created_at?: string;
    updated_at?: string;
}
