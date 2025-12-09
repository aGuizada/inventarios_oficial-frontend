import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Almacen, ApiResponse, PaginatedResponse, PaginationParams } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AlmacenService {
    private apiUrl = `${environment.apiUrl}/almacenes`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<Almacen[]>> {
        return this.http.get<ApiResponse<Almacen[]>>(this.apiUrl);
    }

    getPaginated(params?: PaginationParams): Observable<ApiResponse<PaginatedResponse<Almacen>>> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                const value = (params as any)[key];
                if (value !== undefined && value !== null) {
                    httpParams = httpParams.set(key, value.toString());
                }
            });
        }
        return this.http.get<ApiResponse<PaginatedResponse<Almacen>>>(this.apiUrl, { params: httpParams });
    }

    getById(id: number): Observable<ApiResponse<Almacen>> {
        return this.http.get<ApiResponse<Almacen>>(`${this.apiUrl}/${id}`);
    }

    create(almacen: Partial<Almacen>): Observable<ApiResponse<Almacen>> {
        return this.http.post<ApiResponse<Almacen>>(this.apiUrl, almacen);
    }

    update(id: number, almacen: Partial<Almacen>): Observable<ApiResponse<Almacen>> {
        return this.http.put<ApiResponse<Almacen>>(`${this.apiUrl}/${id}`, almacen);
    }

    delete(id: number): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
    }
}
