import { Venta } from './venta.interface';

export interface CreditoVenta {
    id: number;
    venta_id: number;
    cliente_id: number;
    numero_cuotas: number;
    tiempo_dias_cuota: number;
    total: number;
    estado: string;
    proximo_pago?: string;
    created_at?: string;
    updated_at?: string;
    venta?: Venta;
    cliente?: any;
    cuotas?: CuotaCredito[];
    // Campos alternativos para compatibilidad
    monto_total?: number;
    monto_pagado?: number;
    saldo?: number;
    fecha_vencimiento?: string;
}

export interface CuotaCredito {
    id: number;
    credito_id: number;
    credito_venta_id?: number; // Alias para compatibilidad
    cobrador_id?: number;
    numero_cuota: number;
    fecha_pago: string;
    fecha_cancelado?: string;
    precio_cuota: number;
    saldo_restante: number;
    estado: string;
    created_at: string;
    updated_at: string;
    credito?: CreditoVenta;
    cobrador?: any;
    // Campos alternativos para compatibilidad
    monto?: number;
    fecha_vencimiento?: string;
}
