import { Proveedor } from './proveedor.interface';

export interface Compra {
    id: number;
    numero_compra: string;
    fecha: string;
    proveedor_id: number;
    tipo_compra: string; // 'contado' | 'credito'
    tipo_pago_id?: number;
    subtotal: number;
    descuento: number;
    total: number;
    user_id: number;
    sucursal_id: number;
    estado: string;
    created_at: string;
    updated_at: string;
    proveedor?: Proveedor;
    tipo_pago?: any;
    detalles?: DetalleCompra[];
}

export interface DetalleCompra {
    id: number;
    compra_id: number;
    articulo_id: number;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    created_at: string;
    updated_at: string;
    articulo?: any;
}

export interface CompraCuota {
    id: number;
    compra_credito_id: number;
    numero_cuota: number;
    monto: number;
    fecha_vencimiento: string;
    fecha_pago?: string;
    estado: string;
    created_at: string;
    updated_at: string;
}
