import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CuotaCredito, ApiResponse } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CuotaCreditoService {
    private apiUrl = `${environment.apiUrl}/cuotas-credito`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<CuotaCredito[]>> {
        return this.http.get<ApiResponse<CuotaCredito[]>>(this.apiUrl);
    }

    getByCreditoId(creditoId: number): Observable<ApiResponse<CuotaCredito[]>> {
        return this.http.get<ApiResponse<CuotaCredito[]>>(`${this.apiUrl}/credito/${creditoId}`);
    }

    getById(id: number): Observable<ApiResponse<CuotaCredito>> {
        return this.http.get<ApiResponse<CuotaCredito>>(`${this.apiUrl}/${id}`);
    }

    pagarCuota(cuotaId: number, monto: number, cobradorId?: number): Observable<ApiResponse<CuotaCredito>> {
        return this.http.post<ApiResponse<CuotaCredito>>(`${this.apiUrl}/${cuotaId}/pagar`, {
            monto,
            cobrador_id: cobradorId
        });
    }

    create(cuota: Partial<CuotaCredito>): Observable<ApiResponse<CuotaCredito>> {
        return this.http.post<ApiResponse<CuotaCredito>>(this.apiUrl, cuota);
    }

    update(id: number, cuota: Partial<CuotaCredito>): Observable<ApiResponse<CuotaCredito>> {
        return this.http.put<ApiResponse<CuotaCredito>>(`${this.apiUrl}/${id}`, cuota);
    }
}










