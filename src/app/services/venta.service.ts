import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { Venta, ApiResponse, PaginatedResponse, PaginationParams } from '../interfaces';
import { environment } from '../../environments/environment';

export interface ProductoInventario {
    inventario_id: number;
    articulo_id: number;
    almacen_id: number;
    stock_disponible: number;
    cantidad: number;
    articulo?: any;
    almacen?: any;
    stock_disponible_original?: number; // Stock original antes de descontar el carrito
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

    getPaginated(params?: PaginationParams): Observable<ApiResponse<PaginatedResponse<Venta>>> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                const value = (params as any)[key];
                if (value !== undefined && value !== null) {
                    httpParams = httpParams.set(key, value.toString());
                }
            });
        }
        return this.http.get<ApiResponse<PaginatedResponse<Venta>>>(this.apiUrl, { params: httpParams });
    }

    getById(id: number): Observable<Venta> {
        return this.http.get<Venta>(`${this.apiUrl}/${id}`);
    }

    create(venta: Partial<Venta>): Observable<Venta> {
        return this.http.post<Venta>(this.apiUrl, venta);
    }

    private productosCache: Map<string, Observable<ProductoInventario[]>> = new Map();

    getProductosInventario(almacenId?: number, forceRefresh: boolean = false): Observable<ProductoInventario[]> {
        const cacheKey = almacenId?.toString() || 'all';
        
        // Si se fuerza la recarga, limpiar el caché para este almacén
        if (forceRefresh && this.productosCache.has(cacheKey)) {
            this.productosCache.delete(cacheKey);
        }
        
        // Si ya existe una petición en curso para este almacén, reutilizarla
        if (!this.productosCache.has(cacheKey)) {
            let params = new HttpParams();
            if (almacenId) {
                params = params.set('almacen_id', almacenId.toString());
            }
            // Agregar timestamp para evitar caché del navegador cuando se fuerza la recarga
            if (forceRefresh) {
                params = params.set('_t', Date.now().toString());
            }
            const request = this.http.get<ProductoInventario[]>(`${this.apiUrl}/productos-inventario`, { params })
                .pipe(
                    shareReplay(1) // Cachear la respuesta y compartirla entre suscriptores
                );
            this.productosCache.set(cacheKey, request);
        }
        
        return this.productosCache.get(cacheKey)!;
    }

    /**
     * Limpia el caché de productos del inventario
     */
    clearProductosCache(almacenId?: number): void {
        if (almacenId) {
            const cacheKey = almacenId.toString();
            this.productosCache.delete(cacheKey);
        } else {
            // Limpiar todo el caché
            this.productosCache.clear();
        }
    }

    anular(id: number): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/${id}/anular`, {});
    }

    imprimirComprobante(id: number, formato: 'rollo' | 'carta'): void {
        const url = `${this.apiUrl}/${id}/imprimir/${formato}`;
        window.open(url, '_blank');
    }
}
