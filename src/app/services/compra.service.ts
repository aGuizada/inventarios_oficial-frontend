import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Compra, ApiResponse, PaginatedResponse } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CompraService {
    private apiUrl = `${environment.apiUrl}/compras`;

    constructor(private http: HttpClient) { }

    getAll(page: number = 1): Observable<PaginatedResponse<Compra>> {
        const params = new HttpParams().set('page', page.toString());
        return this.http.get<PaginatedResponse<Compra>>(this.apiUrl, { params });
    }

    getById(id: number): Observable<ApiResponse<Compra>> {
        return this.http.get<ApiResponse<Compra>>(`${this.apiUrl}/${id}`);
    }

    create(compra: Partial<Compra>): Observable<ApiResponse<Compra>> {
        return this.http.post<ApiResponse<Compra>>(this.apiUrl, compra);
    }

    anular(id: number): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/anular`, {});
    }
}
