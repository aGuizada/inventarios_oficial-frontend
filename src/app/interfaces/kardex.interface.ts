import { Articulo } from './articulo.interface';
import { Almacen } from './almacen.interface';
import { User } from './user.interface';

export interface Kardex {
    id: number;
    fecha: string;
    tipo_movimiento: string; // 'compra' | 'venta' | 'ajuste' | 'traspaso_entrada' | 'traspaso_salida'
    documento_tipo?: string;
    documento_numero?: string;
    articulo_id: number;
    almacen_id: number;
    cantidad_entrada: number;
    cantidad_salida: number;
    cantidad_saldo: number;
    costo_unitario: number;
    costo_total: number;
    precio_unitario?: number;
    precio_total?: number;
    observaciones?: string;
    usuario_id: number;
    compra_id?: number;
    venta_id?: number;
    traspaso_id?: number;
    created_at: string;
    updated_at: string;

    // Relaciones
    articulo?: Articulo;
    almacen?: Almacen;
    usuario?: User;
}

export interface KardexFiltros {
    articulo_id?: number;
    almacen_id?: number;
    tipo_movimiento?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
}
