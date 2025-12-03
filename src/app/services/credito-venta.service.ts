import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreditoVenta, ApiResponse } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CreditoVentaService {
    private apiUrl = `${environment.apiUrl}/creditos-venta`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<CreditoVenta[]>> {
        return this.http.get<ApiResponse<CreditoVenta[]>>(this.apiUrl);
    }

    getById(id: number): Observable<ApiResponse<CreditoVenta>> {
        return this.http.get<ApiResponse<CreditoVenta>>(`${this.apiUrl}/${id}`);
    }

    pagarCuota(creditoId: number, cuotaId: number, monto: number): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${creditoId}/cuotas/${cuotaId}/pagar`, { monto });
    }
}
