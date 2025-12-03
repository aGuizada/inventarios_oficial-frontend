import { Cliente } from './cliente.interface';
import { User } from './user.interface';
import { Almacen } from './almacen.interface';
import { Articulo } from './articulo.interface';

export interface Cotizacion {
    id: number;
    cliente_id: number;
    user_id: number;
    almacen_id: number;
    fecha_hora: string;
    total: number;
    validez?: string;
    plazo_entrega?: string;
    tiempo_entrega?: string;
    lugar_entrega?: string;
    forma_pago?: string;
    nota?: string;
    estado?: string;
    created_at?: string;
    updated_at?: string;
    cliente?: Cliente;
    user?: User;
    almacen?: Almacen;
    detalles?: DetalleCotizacion[];
}

export interface DetalleCotizacion {
    id?: number;
    cotizacion_id?: number;
    articulo_id: number;
    cantidad: number;
    precio_unitario: number;
    descuento?: number;
    subtotal: number;
    created_at?: string;
    updated_at?: string;
    articulo?: Articulo;
}
