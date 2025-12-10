import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CompraCuota, ApiResponse } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CompraCuotaService {
    private apiUrl = `${environment.apiUrl}/compra-cuotas`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<CompraCuota[]> {
        return this.http.get<CompraCuota[]>(this.apiUrl);
    }

    getById(id: number): Observable<CompraCuota> {
        return this.http.get<CompraCuota>(`${this.apiUrl}/${id}`);
    }

    getByCompraCredito(compraCreditoId: number): Observable<ApiResponse<CompraCuota[]>> {
        return this.http.get<ApiResponse<CompraCuota[]>>(`${this.apiUrl}/compra-credito/${compraCreditoId}`);
    }

    pagarCuota(id: number, monto: number, fechaPago?: string): Observable<ApiResponse<CompraCuota>> {
        const fecha = fechaPago || new Date().toISOString().split('T')[0];
        return this.http.post<ApiResponse<CompraCuota>>(`${this.apiUrl}/${id}/pagar`, {
            monto_pagado: monto,
            fecha_pago: fecha
        });
    }

    update(id: number, cuota: Partial<CompraCuota>): Observable<CompraCuota> {
        return this.http.put<CompraCuota>(`${this.apiUrl}/${id}`, cuota);
    }

    delete(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${id}`);
    }
}

