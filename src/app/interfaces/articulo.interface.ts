import { Categoria } from './categoria.interface';
import { Marca } from './marca.interface';
import { Medida } from './medida.interface';
import { Industria } from './industria.interface';

export interface Articulo {
    id: number;
    codigo: string;
    nombre: string;
    descripcion?: string;
    precio_compra: number;
    precio_venta: number;
    stock_minimo: number;
    stock_maximo: number;
    categoria_id: number;
    marca_id?: number;
    medida_id?: number;
    industria_id?: number;
    imagen?: string;
    estado: boolean;
    created_at: string;
    updated_at: string;
    categoria?: Categoria;
    marca?: Marca;
    medida?: Medida;
    industria?: Industria;
}
