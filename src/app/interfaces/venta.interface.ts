import { Cliente } from './cliente.interface';
import { TipoVenta } from './tipo-venta.interface';
import { TipoPago } from './tipo-pago.interface';
import { Articulo } from './articulo.interface';
import { User } from './user.interface';

export interface Venta {
    id?: number;
    cliente_id: number;
    user_id: number;
    tipo_venta_id: number;
    tipo_pago_id: number;
    tipo_comprobante?: string;
    serie_comprobante?: string;
    num_comprobante?: string;
    fecha_hora: string;
    total: number;
    estado?: string;
    caja_id: number;
    almacen_id?: number; // Para validar stock
    created_at?: string;
    updated_at?: string;
    cliente?: Cliente;
    tipo_venta?: TipoVenta;
    tipo_pago?: TipoPago;
    detalles?: DetalleVenta[];
    user?: User;
}

export interface DetalleVenta {
    id?: number;
    venta_id?: number;
    articulo_id: number;
    cantidad: number;
    precio: number;
    descuento?: number;
    created_at?: string;
    updated_at?: string;
    articulo?: Articulo;
    unidad_medida?: string;
}
