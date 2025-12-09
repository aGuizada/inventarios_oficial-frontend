import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Inventario, ApiResponse, PaginatedResponse, PaginationParams } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class InventarioService {
    private apiUrl = `${environment.apiUrl}/inventarios`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<Inventario[]> {
        return this.http.get<Inventario[]>(this.apiUrl);
    }

    getPaginated(params?: PaginationParams): Observable<ApiResponse<PaginatedResponse<Inventario>>> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                const value = (params as any)[key];
                if (value !== undefined && value !== null) {
                    httpParams = httpParams.set(key, value.toString());
                }
            });
        }
        return this.http.get<ApiResponse<PaginatedResponse<Inventario>>>(this.apiUrl, { params: httpParams });
    }

    getByAlmacen(almacenId: number): Observable<Inventario[]> {
        return this.http.get<Inventario[]>(`${this.apiUrl}?almacen_id=${almacenId}`);
    }

    getById(id: number): Observable<Inventario> {
        return this.http.get<Inventario>(`${this.apiUrl}/${id}`);
    }
}
