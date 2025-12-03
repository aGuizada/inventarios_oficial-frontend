import { Caja } from './caja.interface';
import { User } from './user.interface';

export interface ArqueoCaja {
    id: number;
    caja_id: number;
    user_id: number;
    billete200: number;
    billete100: number;
    billete50: number;
    billete20: number;
    billete10: number;
    moneda5: number;
    moneda2: number;
    moneda1: number;
    moneda050: number;
    moneda020: number;
    moneda010: number;
    total_efectivo: number;
    created_at?: string;
    updated_at?: string;
    caja?: Caja;
    user?: User;
}
