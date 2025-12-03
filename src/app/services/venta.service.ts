import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Venta, ApiResponse, PaginatedResponse } from '../interfaces';
import { environment } from '../../environments/environment';

export interface ProductoInventario {
    inventario_id: number;
    articulo_id: number;
    almacen_id: number;
    stock_disponible: number;
    cantidad: number;
    articulo?: any;
    almacen?: any;
}

@Injectable({
    providedIn: 'root'
})
export class VentaService {
    private apiUrl = `${environment.apiUrl}/ventas`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<Venta[]> {
        return this.http.get<Venta[]>(this.apiUrl);
    }

    getById(id: number): Observable<Venta> {
        return this.http.get<Venta>(`${this.apiUrl}/${id}`);
    }

    create(venta: Partial<Venta>): Observable<Venta> {
        return this.http.post<Venta>(this.apiUrl, venta);
    }

    getProductosInventario(almacenId?: number): Observable<ProductoInventario[]> {
        let params = new HttpParams();
        if (almacenId) {
            params = params.set('almacen_id', almacenId.toString());
        }
        return this.http.get<ProductoInventario[]>(`${this.apiUrl}/productos-inventario`, { params });
    }

    anular(id: number): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/${id}/anular`, {});
    }
}
