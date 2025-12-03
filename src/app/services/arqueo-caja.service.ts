import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ArqueoCaja, ApiResponse } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ArqueoCajaService {
    private apiUrl = `${environment.apiUrl}/arqueos-caja`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<ArqueoCaja[]>> {
        return this.http.get<ApiResponse<ArqueoCaja[]>>(this.apiUrl);
    }

    getById(id: number): Observable<ApiResponse<ArqueoCaja>> {
        return this.http.get<ApiResponse<ArqueoCaja>>(`${this.apiUrl}/${id}`);
    }

    create(data: any): Observable<ApiResponse<ArqueoCaja>> {
        return this.http.post<ApiResponse<ArqueoCaja>>(this.apiUrl, data);
    }

    cerrar(id: number, saldoFinal: number, observaciones?: string): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/cerrar`, {
            saldo_final: saldoFinal,
            observaciones
        });
    }
}
