import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Categoria, ApiResponse, PaginatedResponse, PaginationParams } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CategoriaService {
    private apiUrl = `${environment.apiUrl}/categorias`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<Categoria[]>> {
        return this.http.get<ApiResponse<Categoria[]>>(this.apiUrl);
    }

    getPaginated(params?: PaginationParams): Observable<ApiResponse<PaginatedResponse<Categoria>>> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                const value = (params as any)[key];
                if (value !== undefined && value !== null) {
                    httpParams = httpParams.set(key, value.toString());
                }
            });
        }
        return this.http.get<ApiResponse<PaginatedResponse<Categoria>>>(this.apiUrl, { params: httpParams });
    }

    getById(id: number): Observable<ApiResponse<Categoria>> {
        return this.http.get<ApiResponse<Categoria>>(`${this.apiUrl}/${id}`);
    }

    create(categoria: Partial<Categoria>): Observable<ApiResponse<Categoria>> {
        return this.http.post<ApiResponse<Categoria>>(this.apiUrl, categoria);
    }

    update(id: number, categoria: Partial<Categoria>): Observable<ApiResponse<Categoria>> {
        return this.http.put<ApiResponse<Categoria>>(`${this.apiUrl}/${id}`, categoria);
    }

    delete(id: number): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
    }
}
