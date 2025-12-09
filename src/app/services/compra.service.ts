import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Compra, ApiResponse, PaginatedResponse, PaginationParams } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CompraService {
    private apiUrl = `${environment.apiUrl}/compras`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<Compra[]> {
        return this.http.get<Compra[]>(this.apiUrl);
    }

    getPaginated(params?: PaginationParams): Observable<ApiResponse<PaginatedResponse<Compra>>> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                const value = (params as any)[key];
                if (value !== undefined && value !== null) {
                    httpParams = httpParams.set(key, value.toString());
                }
            });
        }
        return this.http.get<ApiResponse<PaginatedResponse<Compra>>>(this.apiUrl, { params: httpParams });
    }

    getById(id: number): Observable<Compra> {
        return this.http.get<Compra>(`${this.apiUrl}/${id}`);
    }

    create(compra: Partial<Compra>): Observable<Compra> {
        return this.http.post<Compra>(this.apiUrl, compra);
    }

    update(id: number, compra: Partial<Compra>): Observable<Compra> {
        return this.http.put<Compra>(`${this.apiUrl}/${id}`, compra);
    }

    delete(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${id}`);
    }
}
