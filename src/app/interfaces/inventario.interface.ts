import { Almacen } from './almacen.interface';
import { Articulo } from './articulo.interface';

export interface Inventario {
    id: number;
    articulo_id: number;
    almacen_id: number;
    cantidad: number;
    saldo_stock: number;
    fecha_vencimiento: string;
    created_at: string;
    updated_at: string;
    articulo?: Articulo;
    almacen?: Almacen;
}
