import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreditoVenta, ApiResponse, PaginatedResponse, PaginationParams } from '../interfaces';
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

    getPaginated(params?: PaginationParams): Observable<ApiResponse<PaginatedResponse<CreditoVenta>>> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                const value = (params as any)[key];
                if (value !== undefined && value !== null) {
                    httpParams = httpParams.set(key, value.toString());
                }
            });
        }
        return this.http.get<ApiResponse<PaginatedResponse<CreditoVenta>>>(this.apiUrl, { params: httpParams });
    }

    getById(id: number): Observable<ApiResponse<CreditoVenta>> {
        return this.http.get<ApiResponse<CreditoVenta>>(`${this.apiUrl}/${id}`);
    }

    create(credito: Partial<CreditoVenta>): Observable<ApiResponse<CreditoVenta>> {
        return this.http.post<ApiResponse<CreditoVenta>>(this.apiUrl, credito);
    }

    pagarCuota(creditoId: number, cuotaId: number, monto: number): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${creditoId}/cuotas/${cuotaId}/pagar`, { monto });
    }
}
