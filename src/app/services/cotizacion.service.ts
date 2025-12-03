import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cotizacion, Venta, ApiResponse, PaginatedResponse } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CotizacionService {
    private apiUrl = `${environment.apiUrl}/cotizaciones`;

    constructor(private http: HttpClient) { }

    getAll(page: number = 1): Observable<PaginatedResponse<Cotizacion>> {
        const params = new HttpParams().set('page', page.toString());
        return this.http.get<PaginatedResponse<Cotizacion>>(this.apiUrl, { params });
    }

    getById(id: number): Observable<ApiResponse<Cotizacion>> {
        return this.http.get<ApiResponse<Cotizacion>>(`${this.apiUrl}/${id}`);
    }

    create(cotizacion: Partial<Cotizacion>): Observable<ApiResponse<Cotizacion>> {
        return this.http.post<ApiResponse<Cotizacion>>(this.apiUrl, cotizacion);
    }

    convertirAVenta(id: number): Observable<ApiResponse<Venta>> {
        return this.http.post<ApiResponse<Venta>>(`${this.apiUrl}/${id}/convertir`, {});
    }
}
