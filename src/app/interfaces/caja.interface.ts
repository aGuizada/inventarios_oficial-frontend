import { Sucursal } from './sucursal.interface';

export interface Caja {
    id: number;
    sucursal_id: number;
    user_id: number;
    fecha_apertura?: string;
    fecha_cierre?: string;
    saldo_inicial: number;
    depositos: number;
    salidas: number;
    ventas: number;
    ventas_contado: number;
    ventas_credito: number;
    pagos_efectivo: number;
    pagos_qr: number;
    pagos_transferencia: number;
    cuotas_ventas_credito: number;
    compras_contado: number;
    compras_credito: number;
    saldo_faltante: number;
    saldo_caja: number;
    estado: string | number | boolean;
    created_at?: string;
    updated_at?: string;
    sucursal?: Sucursal;
    user?: any; // Define User interface if needed
}
