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

    getAll(page: number = 1, perPage: number = 10): Observable<PaginatedResponse<Articulo>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('per_page', perPage.toString());
        return this.http.get<PaginatedResponse<Articulo>>(this.apiUrl, { params });
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
}
