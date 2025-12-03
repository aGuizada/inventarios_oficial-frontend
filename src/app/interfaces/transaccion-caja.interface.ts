import { Caja } from './caja.interface';
import { User } from './user.interface';

export interface TransaccionCaja {
    id: number;
    caja_id: number;
    user_id: number;
    fecha: string;
    transaccion: string; // 'ingreso' | 'egreso'
    importe: number;
    descripcion: string;
    referencia?: string;
    created_at?: string;
    updated_at?: string;
    caja?: Caja;
    user?: User;
}
