import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Categoria, ApiResponse } from '../interfaces';
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
