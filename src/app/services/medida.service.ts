import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Medida, ApiResponse, PaginatedResponse, PaginationParams } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class MedidaService {
    private apiUrl = `${environment.apiUrl}/medidas`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<Medida[]>> {
        return this.http.get<ApiResponse<Medida[]>>(this.apiUrl);
    }

    getPaginated(params?: PaginationParams): Observable<ApiResponse<PaginatedResponse<Medida>>> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                const value = (params as any)[key];
                if (value !== undefined && value !== null) {
                    httpParams = httpParams.set(key, value.toString());
                }
            });
        }
        return this.http.get<ApiResponse<PaginatedResponse<Medida>>>(this.apiUrl, { params: httpParams });
    }

    create(medida: Partial<Medida>): Observable<ApiResponse<Medida>> {
        return this.http.post<ApiResponse<Medida>>(this.apiUrl, medida);
    }

    update(id: number, medida: Partial<Medida>): Observable<ApiResponse<Medida>> {
        return this.http.put<ApiResponse<Medida>>(`${this.apiUrl}/${id}`, medida);
    }

    delete(id: number): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
    }
}
