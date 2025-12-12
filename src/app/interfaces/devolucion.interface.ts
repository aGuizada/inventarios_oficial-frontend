import { Venta } from './venta.interface';
import { User } from './user.interface';
import { Articulo } from './articulo.interface';
import { Almacen } from './almacen.interface';

export interface DetalleDevolucionVenta {
    id?: number;
    devolucion_venta_id?: number;
    articulo_id: number;
    almacen_id: number;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    articulo?: Articulo;
    almacen?: Almacen;
}

export interface DevolucionVenta {
    id?: number;
    venta_id: number;
    fecha: string;
    motivo: string;
    monto_devuelto: number;
    estado: string;
    observaciones?: string;
    usuario_id: number;
    created_at?: string;
    updated_at?: string;
    venta?: Venta;
    usuario?: User;
    detalles?: DetalleDevolucionVenta[];
}
