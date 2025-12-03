import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente, ApiResponse } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ClienteService {
    private apiUrl = `${environment.apiUrl}/clientes`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<Cliente[]>> {
        return this.http.get<ApiResponse<Cliente[]>>(this.apiUrl);
    }

    getById(id: number): Observable<ApiResponse<Cliente>> {
        return this.http.get<ApiResponse<Cliente>>(`${this.apiUrl}/${id}`);
    }

    create(cliente: Partial<Cliente>): Observable<ApiResponse<Cliente>> {
        return this.http.post<ApiResponse<Cliente>>(this.apiUrl, cliente);
    }

    update(id: number, cliente: Partial<Cliente>): Observable<ApiResponse<Cliente>> {
        return this.http.put<ApiResponse<Cliente>>(`${this.apiUrl}/${id}`, cliente);
    }

    delete(id: number): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
    }

    search(term: string): Observable<ApiResponse<Cliente[]>> {
        return this.http.get<ApiResponse<Cliente[]>>(`${this.apiUrl}/search`, {
            params: { q: term }
        });
    }
}
