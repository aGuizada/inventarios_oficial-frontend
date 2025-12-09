import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Sucursal, ApiResponse, PaginatedResponse, PaginationParams } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SucursalService {
    private apiUrl = `${environment.apiUrl}/sucursales`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<Sucursal[]>> {
        return this.http.get<ApiResponse<Sucursal[]>>(this.apiUrl);
    }

    getPaginated(params?: PaginationParams): Observable<ApiResponse<PaginatedResponse<Sucursal>>> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                const value = (params as any)[key];
                if (value !== undefined && value !== null) {
                    httpParams = httpParams.set(key, value.toString());
                }
            });
        }
        return this.http.get<ApiResponse<PaginatedResponse<Sucursal>>>(this.apiUrl, { params: httpParams });
    }

    getById(id: number): Observable<ApiResponse<Sucursal>> {
        return this.http.get<ApiResponse<Sucursal>>(`${this.apiUrl}/${id}`);
    }

    create(sucursal: Partial<Sucursal>): Observable<ApiResponse<Sucursal>> {
        return this.http.post<ApiResponse<Sucursal>>(this.apiUrl, sucursal);
    }

    update(id: number, sucursal: Partial<Sucursal>): Observable<ApiResponse<Sucursal>> {
        return this.http.put<ApiResponse<Sucursal>>(`${this.apiUrl}/${id}`, sucursal);
    }

    delete(id: number): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
    }
}
