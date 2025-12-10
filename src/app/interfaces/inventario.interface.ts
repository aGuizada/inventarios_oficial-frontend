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

// Vista agregada por ítem
export interface InventarioPorItem {
    articulo: Articulo;
    total_stock: number;
    total_saldo: number;
    almacenes: AlmacenStock[];
}

export interface AlmacenStock {
    almacen: string;
    cantidad: number;
    saldo_stock: number;
}

// Vista detallada por lotes
export interface InventarioPorLote extends Inventario {
    // Hereda todos los campos de Inventario
    // Representa cada registro como un "lote" individual
}
