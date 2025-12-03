import { Proveedor } from './proveedor.interface';

export interface Compra {
    id: number;
    proveedor_id: number;
    user_id: number;
    tipo_comprobante?: string;
    serie_comprobante?: string;
    num_comprobante?: string;
    fecha_hora: string;
    total: number;
    estado?: string;
    almacen_id: number;
    caja_id?: number;
    descuento_global?: number;
    tipo_compra: 'contado' | 'credito';
    created_at?: string;
    updated_at?: string;
    proveedor?: Proveedor;
    detalles?: DetalleCompra[];
    compra_contado?: any;
    compra_credito?: any;
}

export interface DetalleCompra {
    id: number;
    compra_base_id: number;
    articulo_id: number;
    cantidad: number;
    precio_unitario: number;
    descuento?: number;
    subtotal: number;
    created_at?: string;
    updated_at?: string;
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
