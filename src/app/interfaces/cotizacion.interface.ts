import { Cliente } from './cliente.interface';

export interface Cotizacion {
    id: number;
    numero_cotizacion: string;
    fecha: string;
    cliente_id?: number;
    subtotal: number;
    descuento: number;
    total: number;
    validez_dias: number;
    estado: string;
    user_id: number;
    created_at: string;
    updated_at: string;
    cliente?: Cliente;
    detalles?: DetalleCotizacion[];
}

export interface DetalleCotizacion {
    id: number;
    cotizacion_id: number;
    articulo_id: number;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    created_at: string;
    updated_at: string;
    articulo?: any;
}
