import { Cliente } from './cliente.interface';
import { TipoVenta } from './tipo-venta.interface';
import { TipoPago } from './tipo-pago.interface';

export interface Venta {
    id: number;
    numero_venta: string;
    fecha: string;
    cliente_id?: number;
    tipo_venta_id: number;
    tipo_pago_id: number;
    subtotal: number;
    descuento: number;
    total: number;
    user_id: number;
    sucursal_id: number;
    caja_id?: number;
    estado: string;
    created_at: string;
    updated_at: string;
    cliente?: Cliente;
    tipo_venta?: TipoVenta;
    tipo_pago?: TipoPago;
    detalles?: DetalleVenta[];
}

export interface DetalleVenta {
    id: number;
    venta_id: number;
    articulo_id: number;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    created_at: string;
    updated_at: string;
    articulo?: any;
}
