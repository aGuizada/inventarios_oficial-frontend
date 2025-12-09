import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Empresa, ApiResponse, PaginatedResponse, PaginationParams } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class EmpresaService {
    private apiUrl = `${environment.apiUrl}/empresas`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<Empresa[]>> {
        return this.http.get<ApiResponse<Empresa[]>>(this.apiUrl);
    }

    getPaginated(params?: PaginationParams): Observable<ApiResponse<PaginatedResponse<Empresa>>> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                const value = (params as any)[key];
                if (value !== undefined && value !== null) {
                    httpParams = httpParams.set(key, value.toString());
                }
            });
        }
        return this.http.get<ApiResponse<PaginatedResponse<Empresa>>>(this.apiUrl, { params: httpParams });
    }

    getById(id: number): Observable<ApiResponse<Empresa>> {
        return this.http.get<ApiResponse<Empresa>>(`${this.apiUrl}/${id}`);
    }

    create(empresa: Partial<Empresa>): Observable<ApiResponse<Empresa>> {
        return this.http.post<ApiResponse<Empresa>>(this.apiUrl, empresa);
    }

    update(id: number, empresa: Partial<Empresa>): Observable<ApiResponse<Empresa>> {
        return this.http.put<ApiResponse<Empresa>>(`${this.apiUrl}/${id}`, empresa);
    }

    delete(id: number): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
    }
}
