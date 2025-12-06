import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TipoVenta, ApiResponse } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class TipoVentaService {
    private apiUrl = `${environment.apiUrl}/tipos-venta`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<TipoVenta[]>> {
        return this.http.get<ApiResponse<TipoVenta[]>>(this.apiUrl);
    }

    getById(id: number): Observable<ApiResponse<TipoVenta>> {
        return this.http.get<ApiResponse<TipoVenta>>(`${this.apiUrl}/${id}`);
    }

    create(tipoVenta: Partial<TipoVenta>): Observable<ApiResponse<TipoVenta>> {
        return this.http.post<ApiResponse<TipoVenta>>(this.apiUrl, tipoVenta);
    }

    update(id: number, tipoVenta: Partial<TipoVenta>): Observable<ApiResponse<TipoVenta>> {
        return this.http.put<ApiResponse<TipoVenta>>(`${this.apiUrl}/${id}`, tipoVenta);
    }

    delete(id: number): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
    }
}



