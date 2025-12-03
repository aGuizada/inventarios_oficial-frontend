import { Venta } from './venta.interface';

export interface CreditoVenta {
    id: number;
    venta_id: number;
    monto_total: number;
    monto_pagado: number;
    saldo: number;
    fecha_vencimiento: string;
    estado: string;
    created_at: string;
    updated_at: string;
    venta?: Venta;
    cuotas?: CuotaCredito[];
}

export interface CuotaCredito {
    id: number;
    credito_venta_id: number;
    numero_cuota: number;
    monto: number;
    fecha_vencimiento: string;
    fecha_pago?: string;
    estado: string;
    created_at: string;
    updated_at: string;
}
