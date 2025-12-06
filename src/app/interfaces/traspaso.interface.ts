import { Almacen } from './almacen.interface';
import { Articulo } from './articulo.interface';
import { Sucursal } from './sucursal.interface';

export interface Traspaso {
    id: number;
    codigo_traspaso: string;
    sucursal_origen_id: number;
    sucursal_destino_id: number;
    almacen_origen_id: number;
    almacen_destino_id: number;
    user_id: number;
    fecha_solicitud: string;
    fecha_aprobacion?: string;
    fecha_entrega?: string;
    tipo_traspaso?: string;
    estado: string;
    motivo?: string;
    observaciones?: string;
    usuario_aprobador_id?: number;
    usuario_receptor_id?: number;
    created_at?: string;
    updated_at?: string;
    sucursal_origen?: Sucursal;
    sucursal_destino?: Sucursal;
    almacen_origen?: Almacen;
    almacen_destino?: Almacen;
    detalles?: DetalleTraspaso[];
}

export interface DetalleTraspaso {
    id?: number;
    traspaso_id?: number;
    articulo_id: number;
    inventario_id?: number;
    inventario_origen_id?: number;
    cantidad_solicitada: number;
    cantidad_aprobada?: number;
    cantidad_enviada?: number;
    cantidad_recibida?: number;
    precio_costo?: number;
    precio_venta?: number;
    lote?: string;
    fecha_vencimiento?: string;
    observaciones?: string;
    estado?: string;
    created_at?: string;
    updated_at?: string;
    articulo?: Articulo;
}
