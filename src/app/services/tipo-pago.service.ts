import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TipoPago, ApiResponse } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class TipoPagoService {
    private apiUrl = `${environment.apiUrl}/tipos-pago`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<TipoPago[]>> {
        return this.http.get<ApiResponse<TipoPago[]>>(this.apiUrl);
    }

    getById(id: number): Observable<ApiResponse<TipoPago>> {
        return this.http.get<ApiResponse<TipoPago>>(`${this.apiUrl}/${id}`);
    }

    create(tipoPago: Partial<TipoPago>): Observable<ApiResponse<TipoPago>> {
        return this.http.post<ApiResponse<TipoPago>>(this.apiUrl, tipoPago);
    }

    update(id: number, tipoPago: Partial<TipoPago>): Observable<ApiResponse<TipoPago>> {
        return this.http.put<ApiResponse<TipoPago>>(`${this.apiUrl}/${id}`, tipoPago);
    }

    delete(id: number): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
    }
}














