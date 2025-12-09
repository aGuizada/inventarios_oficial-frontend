import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Moneda, ApiResponse, PaginatedResponse, PaginationParams } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class MonedaService {
    private apiUrl = `${environment.apiUrl}/monedas`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<Moneda[]>> {
        return this.http.get<ApiResponse<Moneda[]>>(this.apiUrl);
    }

    getPaginated(params?: PaginationParams): Observable<ApiResponse<PaginatedResponse<Moneda>>> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                const value = (params as any)[key];
                if (value !== undefined && value !== null) {
                    httpParams = httpParams.set(key, value.toString());
                }
            });
        }
        return this.http.get<ApiResponse<PaginatedResponse<Moneda>>>(this.apiUrl, { params: httpParams });
    }

    getById(id: number): Observable<ApiResponse<Moneda>> {
        return this.http.get<ApiResponse<Moneda>>(`${this.apiUrl}/${id}`);
    }

    create(moneda: Partial<Moneda>): Observable<ApiResponse<Moneda>> {
        return this.http.post<ApiResponse<Moneda>>(this.apiUrl, moneda);
    }

    update(id: number, moneda: Partial<Moneda>): Observable<ApiResponse<Moneda>> {
        return this.http.put<ApiResponse<Moneda>>(`${this.apiUrl}/${id}`, moneda);
    }

    delete(id: number): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
    }
}
