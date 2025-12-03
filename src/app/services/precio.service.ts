import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Precio, ApiResponse } from '../interfaces';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PrecioService {
    private apiUrl = `${environment.apiUrl}/precios`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ApiResponse<Precio[]>> {
        return this.http.get<ApiResponse<Precio[]>>(this.apiUrl);
    }

    getByArticulo(articuloId: number): Observable<ApiResponse<Precio[]>> {
        return this.http.get<ApiResponse<Precio[]>>(`${this.apiUrl}/articulo/${articuloId}`);
    }

    create(precio: Partial<Precio>): Observable<ApiResponse<Precio>> {
        return this.http.post<ApiResponse<Precio>>(this.apiUrl, precio);
    }

    update(id: number, precio: Partial<Precio>): Observable<ApiResponse<Precio>> {
        return this.http.put<ApiResponse<Precio>>(`${this.apiUrl}/${id}`, precio);
    }

    delete(id: number): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
    }
}
