import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente, ApiResponse, PaginatedResponse, PaginationParams } from '../interfaces';
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

    getPaginated(params?: PaginationParams): Observable<ApiResponse<PaginatedResponse<Cliente>>> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                const value = (params as any)[key];
                if (value !== undefined && value !== null) {
                    httpParams = httpParams.set(key, value.toString());
                }
            });
        }
        return this.http.get<ApiResponse<PaginatedResponse<Cliente>>>(this.apiUrl, { params: httpParams });
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
    exportExcel(): void {
        window.open(`${this.apiUrl}/export-excel`, '_blank');
    }

    exportPDF(): void {
        window.open(`${this.apiUrl}/export-pdf`, '_blank');
    }
}
