import { Caja } from './caja.interface';
import { User } from './user.interface';

export interface TransaccionCaja {
    id: number;
    caja_id: number;
    tipo: string; // 'ingreso' | 'egreso'
    monto: number;
    concepto: string;
    referencia?: string;
    user_id: number;
    fecha: string;
    created_at: string;
    updated_at: string;
    caja?: Caja;
    user?: User;
}
