import { Categoria } from './categoria.interface';
import { Marca } from './marca.interface';
import { Medida } from './medida.interface';
import { Industria } from './industria.interface';

export interface Articulo {
    id: number;
    categoria_id: number;
    proveedor_id: number;
    medida_id: number;
    marca_id: number;
    industria_id: number;
    codigo: string;
    nombre: string;
    unidad_envase: number;
    precio_costo_unid: number;
    precio_costo_paq: number;
    precio_venta: number;
    precio_uno: number;
    precio_dos: number;
    precio_tres: number;
    precio_cuatro: number;
    stock: number;
    descripcion?: string;
    estado: boolean;
    costo_compra: number;
    vencimiento?: string;
    fotografia?: string;
    created_at?: string;
    updated_at?: string;
    categoria?: Categoria;
    proveedor?: any; // Define Proveedor interface if needed, but avoid circular dependency if possible or use forward ref
    medida?: Medida;
    marca?: Marca;
    industria?: Industria;
}
