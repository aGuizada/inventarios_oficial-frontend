import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Articulo, ApiResponse, PaginatedResponse } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ArticuloService {
    private apiUrl = `${environment.apiUrl}/articulos`;

    constructor(private http: HttpClient) { }

    // Devuelve paginado cuando se envían page/per_page; el backend mantiene compatibilidad con array sin paginar si no se envían.
    getAll(page: number = 1, perPage: number = 10): Observable<ApiResponse<PaginatedResponse<Articulo> | Articulo[]>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('per_page', perPage.toString());
        return this.http.get<ApiResponse<PaginatedResponse<Articulo> | Articulo[]>>(this.apiUrl, { params });
    }
    
    getAllPaginated(params?: { page?: number; per_page?: number; search?: string; sort_by?: string; sort_order?: 'asc' | 'desc' }): Observable<ApiResponse<PaginatedResponse<Articulo>>> {
        let httpParams = new HttpParams();
        
        if (params?.page) {
            httpParams = httpParams.set('page', params.page.toString());
        }
        if (params?.per_page) {
            httpParams = httpParams.set('per_page', params.per_page.toString());
        }
        if (params?.search) {
            httpParams = httpParams.set('search', params.search);
        }
        if (params?.sort_by) {
            httpParams = httpParams.set('sort_by', params.sort_by);
        }
        if (params?.sort_order) {
            httpParams = httpParams.set('sort_order', params.sort_order);
        }
        
        return this.http.get<ApiResponse<PaginatedResponse<Articulo>>>(this.apiUrl, { params: httpParams });
    }

    getById(id: number): Observable<ApiResponse<Articulo>> {
        return this.http.get<ApiResponse<Articulo>>(`${this.apiUrl}/${id}`);
    }

    create(articulo: Partial<Articulo> | FormData): Observable<ApiResponse<Articulo>> {
        return this.http.post<ApiResponse<Articulo>>(this.apiUrl, articulo);
    }

    update(id: number, articulo: Partial<Articulo> | FormData): Observable<ApiResponse<Articulo>> {
        if (articulo instanceof FormData) {
            articulo.append('_method', 'PUT');
            return this.http.post<ApiResponse<Articulo>>(`${this.apiUrl}/${id}`, articulo);
        }
        return this.http.put<ApiResponse<Articulo>>(`${this.apiUrl}/${id}`, articulo);
    }

    delete(id: number): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
    }

    search(term: string): Observable<ApiResponse<Articulo[]>> {
        return this.http.get<ApiResponse<Articulo[]>>(`${this.apiUrl}/search`, {
            params: { q: term }
        });
    }

    downloadTemplate(): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/template/download`, {
            responseType: 'blob'
        });
    }

    importFromExcel(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<any>(`${this.apiUrl}/import`, formData);
    }
}
