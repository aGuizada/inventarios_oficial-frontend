import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DevolucionVenta, ApiResponse, PaginatedResponse } from '../interfaces';

@Injectable({
    providedIn: 'root'
})
export class DevolucionService {
    private apiUrl = `${environment.apiUrl}/devoluciones`;

    constructor(private http: HttpClient) { }

    getAll(params?: { page?: number; per_page?: number; fecha_desde?: string; fecha_hasta?: string; estado?: string }): Observable<ApiResponse<PaginatedResponse<DevolucionVenta>>> {
        let httpParams = new HttpParams();

        if (params?.page) httpParams = httpParams.set('page', params.page.toString());
        if (params?.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());
        if (params?.fecha_desde) httpParams = httpParams.set('fecha_desde', params.fecha_desde);
        if (params?.fecha_hasta) httpParams = httpParams.set('fecha_hasta', params.fecha_hasta);
        if (params?.estado) httpParams = httpParams.set('estado', params.estado);

        return this.http.get<ApiResponse<PaginatedResponse<DevolucionVenta>>>(this.apiUrl, { params: httpParams });
    }

    getById(id: number): Observable<ApiResponse<DevolucionVenta>> {
        return this.http.get<ApiResponse<DevolucionVenta>>(`${this.apiUrl}/${id}`);
    }

    create(devolucion: Partial<DevolucionVenta>): Observable<ApiResponse<DevolucionVenta>> {
        return this.http.post<ApiResponse<DevolucionVenta>>(this.apiUrl, devolucion);
    }
}
