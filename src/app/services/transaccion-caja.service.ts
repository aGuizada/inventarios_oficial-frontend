import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TransaccionCaja, ApiResponse } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class TransaccionCajaService {
    private apiUrl = `${environment.apiUrl}/transacciones-caja`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<TransaccionCaja[]>> {
        return this.http.get<ApiResponse<TransaccionCaja[]>>(this.apiUrl);
    }

    getByCaja(cajaId: number): Observable<ApiResponse<TransaccionCaja[]>> {
        return this.http.get<ApiResponse<TransaccionCaja[]>>(`${this.apiUrl}/caja/${cajaId}`);
    }

    create(transaccion: Partial<TransaccionCaja>): Observable<ApiResponse<TransaccionCaja>> {
        // Asegurar que los datos estén en el formato correcto
        const data = {
            caja_id: transaccion.caja_id,
            user_id: transaccion.user_id,
            transaccion: transaccion.transaccion,
            importe: Number(transaccion.importe),
            descripcion: transaccion.descripcion || '',
            ...(transaccion.fecha && { fecha: transaccion.fecha })
        };
        return this.http.post<ApiResponse<TransaccionCaja>>(this.apiUrl, data);
    }
}
