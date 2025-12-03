export interface Notification {
    id: number;
    user_id: number;
    titulo: string;
    mensaje: string;
    tipo: string;
    leido: boolean;
    created_at: string;
    updated_at: string;
}
