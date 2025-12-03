import { Articulo } from './articulo.interface';
import { Moneda } from './moneda.interface';

export interface Precio {
    id: number;
    articulo_id: number;
    moneda_id: number;
    precio: number;
    fecha_vigencia: string;
    created_at: string;
    updated_at: string;
    articulo?: Articulo;
    moneda?: Moneda;
}
