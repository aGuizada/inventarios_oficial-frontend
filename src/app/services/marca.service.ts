import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Marca, ApiResponse, PaginatedResponse, PaginationParams } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class MarcaService {
    private apiUrl = `${environment.apiUrl}/marcas`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<Marca[]>> {
        return this.http.get<ApiResponse<Marca[]>>(this.apiUrl);
    }

    getPaginated(params?: PaginationParams): Observable<ApiResponse<PaginatedResponse<Marca>>> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                const value = (params as any)[key];
                if (value !== undefined && value !== null) {
                    httpParams = httpParams.set(key, value.toString());
                }
            });
        }
        return this.http.get<ApiResponse<PaginatedResponse<Marca>>>(this.apiUrl, { params: httpParams });
    }

    create(marca: Partial<Marca>): Observable<ApiResponse<Marca>> {
        return this.http.post<ApiResponse<Marca>>(this.apiUrl, marca);
    }

    update(id: number, marca: Partial<Marca>): Observable<ApiResponse<Marca>> {
        return this.http.put<ApiResponse<Marca>>(`${this.apiUrl}/${id}`, marca);
    }

    delete(id: number): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
    }
}
