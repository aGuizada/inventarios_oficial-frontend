import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cotizacion, Venta, ApiResponse, PaginatedResponse, PaginationParams } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CotizacionService {
    private apiUrl = `${environment.apiUrl}/cotizaciones`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<Cotizacion[]> {
        return this.http.get<Cotizacion[]>(this.apiUrl);
    }

    getPaginated(params?: PaginationParams): Observable<ApiResponse<PaginatedResponse<Cotizacion>>> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                const value = (params as any)[key];
                if (value !== undefined && value !== null) {
                    httpParams = httpParams.set(key, value.toString());
                }
            });
        }
        return this.http.get<ApiResponse<PaginatedResponse<Cotizacion>>>(this.apiUrl, { params: httpParams });
    }

    getById(id: number): Observable<Cotizacion> {
        return this.http.get<Cotizacion>(`${this.apiUrl}/${id}`);
    }

    create(cotizacion: Partial<Cotizacion>): Observable<Cotizacion> {
        return this.http.post<Cotizacion>(this.apiUrl, cotizacion);
    }

    update(id: number, cotizacion: Partial<Cotizacion>): Observable<Cotizacion> {
        return this.http.put<Cotizacion>(`${this.apiUrl}/${id}`, cotizacion);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    convertirAVenta(id: number): Observable<ApiResponse<Venta>> {
        return this.http.post<ApiResponse<Venta>>(`${this.apiUrl}/${id}/convertir`, {});
    }
}
