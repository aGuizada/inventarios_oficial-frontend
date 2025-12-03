import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Venta, ApiResponse, PaginatedResponse } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class VentaService {
    private apiUrl = `${environment.apiUrl}/ventas`;

    constructor(private http: HttpClient) { }

    getAll(page: number = 1): Observable<PaginatedResponse<Venta>> {
        const params = new HttpParams().set('page', page.toString());
        return this.http.get<PaginatedResponse<Venta>>(this.apiUrl, { params });
    }

    getById(id: number): Observable<ApiResponse<Venta>> {
        return this.http.get<ApiResponse<Venta>>(`${this.apiUrl}/${id}`);
    }

    create(venta: Partial<Venta>): Observable<ApiResponse<Venta>> {
        return this.http.post<ApiResponse<Venta>>(this.apiUrl, venta);
    }

    anular(id: number): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/anular`, {});
    }
}
