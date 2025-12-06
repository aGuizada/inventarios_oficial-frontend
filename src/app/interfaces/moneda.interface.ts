export interface Moneda {
    id: number;
    empresa_id: number;
    nombre: string;
    pais?: string;
    simbolo: string;
    tipo_cambio: number;
    estado?: boolean;
    created_at?: string;
    updated_at?: string;
    empresa?: {
        id: number;
        nombre: string;
    };
}
