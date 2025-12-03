export interface Rol {
    id: number;
    nombre: string;
    descripcion?: string;
    estado: boolean | string | number;
    created_at?: string;
    updated_at?: string;
}
