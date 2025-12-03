import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Inventario, ApiResponse } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class InventarioService {
    private apiUrl = `${environment.apiUrl}/inventarios`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<Inventario[]>> {
        return this.http.get<ApiResponse<Inventario[]>>(this.apiUrl);
    }

    getByAlmacen(almacenId: number): Observable<ApiResponse<Inventario[]>> {
        return this.http.get<ApiResponse<Inventario[]>>(`${this.apiUrl}/almacen/${almacenId}`);
    }

    ajustar(inventarioId: number, cantidad: number, motivo: string): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${inventarioId}/ajustar`, {
            cantidad,
            motivo
        });
    }
}
