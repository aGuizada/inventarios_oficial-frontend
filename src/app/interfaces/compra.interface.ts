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
    compra_credito?: CompraCredito;
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

export interface CompraCredito {
    id: number;
    num_cuotas: number;
    frecuencia_dias: number;
    cuota_inicial: number;
    tipo_pago_cuota?: string;
    dias_gracia: number;
    interes_moratorio: number;
    estado_credito: string;
    cuotas?: CompraCuota[];
}

export interface CompraCuota {
    id: number;
    compra_credito_id: number;
    numero_cuota: number;
    monto_cuota: number;
    monto_pagado: number;
    saldo_pendiente: number;
    fecha_vencimiento: string;
    fecha_pago?: string | null;
    estado: string;
    created_at?: string;
    updated_at?: string;
}
