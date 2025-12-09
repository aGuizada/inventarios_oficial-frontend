export interface ConfiguracionTrabajo {
    id: number;
    clave: string;
    valor: string;
    descripcion?: string;
    created_at: string;
    updated_at: string;
    mostrar_costo_unitario?: boolean;
    mostrar_costo_paquete?: boolean;
    mostrar_costo_compra?: boolean;
    mostrar_precios_adicionales?: boolean;
    mostrar_vencimiento?: boolean;
    mostrar_stock?: boolean;
}
