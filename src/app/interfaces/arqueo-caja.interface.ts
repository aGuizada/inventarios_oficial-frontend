import { Caja } from './caja.interface';
import { User } from './user.interface';

export interface ArqueoCaja {
    id: number;
    caja_id: number;
    fecha_apertura: string;
    fecha_cierre?: string;
    saldo_inicial: number;
    saldo_final?: number;
    total_ingresos?: number;
    total_egresos?: number;
    diferencia?: number;
    user_id: number;
    estado: string;
    observaciones?: string;
    created_at: string;
    updated_at: string;
    caja?: Caja;
    user?: User;
}
