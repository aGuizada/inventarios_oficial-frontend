import { Almacen } from './almacen.interface';
import { Articulo } from './articulo.interface';

export interface Traspaso {
    id: number;
    almacen_origen_id: number;
    almacen_destino_id: number;
    fecha: string;
    observaciones?: string;
    estado: string;
    user_id: number;
    created_at: string;
    updated_at: string;
    almacen_origen?: Almacen;
    almacen_destino?: Almacen;
    detalles?: DetalleTraspaso[];
}

export interface DetalleTraspaso {
    id: number;
    traspaso_id: number;
    articulo_id: number;
    cantidad: number;
    created_at: string;
    updated_at: string;
    articulo?: Articulo;
}
