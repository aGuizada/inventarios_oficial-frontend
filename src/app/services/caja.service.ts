import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Caja, ApiResponse } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CajaService {
    private apiUrl = `${environment.apiUrl}/cajas`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<Caja[]>> {
        return this.http.get<ApiResponse<Caja[]>>(this.apiUrl);
    }

    getById(id: number): Observable<ApiResponse<Caja>> {
        return this.http.get<ApiResponse<Caja>>(`${this.apiUrl}/${id}`);
    }

    create(caja: Partial<Caja>): Observable<ApiResponse<Caja>> {
        return this.http.post<ApiResponse<Caja>>(this.apiUrl, caja);
    }

    update(id: number, caja: Partial<Caja>): Observable<ApiResponse<Caja>> {
        return this.http.put<ApiResponse<Caja>>(`${this.apiUrl}/${id}`, caja);
    }

    abrir(id: number, saldoInicial: number): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/abrir`, { saldo_inicial: saldoInicial });
    }

    cerrar(id: number): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/cerrar`, {});
    }
}
