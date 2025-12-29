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
        const token = localStorage.getItem('token');
        
        if (!token) {
            alert('No hay token de autenticación. Por favor, inicie sesión nuevamente.');
            window.location.href = '/login';
            return;
        }

        const url = `${this.apiUrl}/${id}/imprimir/${formato}`;

        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Accept', 'application/pdf');
        xhr.responseType = 'blob';

        xhr.onload = function() {
            if (xhr.status === 200) {
                const blob = xhr.response;
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `venta_${id}_${formato}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } else if (xhr.status === 401) {
                alert('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
                window.location.href = '/login';
            } else {
                const reader = new FileReader();
                reader.onload = function() {
                    try {
                        const errorData = JSON.parse(reader.result as string);
                        alert('Error al generar el PDF: ' + (errorData.message || 'Error desconocido'));
                    } catch (e) {
                        alert('Error al generar el PDF. Por favor, intente nuevamente.');
                    }
                };
                reader.readAsText(xhr.response);
            }
        };

        xhr.onerror = function() {
            alert('Error de conexión al descargar el PDF. Por favor, verifique su conexión a internet.');
        };

        xhr.send();
    }

    exportReporteDetalladoPDF(params?: { fecha_desde?: string; fecha_hasta?: string; sucursal_id?: number }): void {
        const token = localStorage.getItem('token');
        
        if (!token) {
            alert('No hay token de autenticación. Por favor, inicie sesión nuevamente.');
            window.location.href = '/login';
            return;
        }

        let url = `${this.apiUrl}/reporte/detallado-pdf`;
        const queryParams = new URLSearchParams();
        
        if (params?.fecha_desde) {
            queryParams.append('fecha_desde', params.fecha_desde);
        }
        if (params?.fecha_hasta) {
            queryParams.append('fecha_hasta', params.fecha_hasta);
        }
        if (params?.sucursal_id) {
            queryParams.append('sucursal_id', params.sucursal_id.toString());
        }
        
        if (queryParams.toString()) {
            url += '?' + queryParams.toString();
        }

        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Accept', 'application/pdf');
        xhr.responseType = 'blob';

        xhr.onload = function() {
            if (xhr.status === 200) {
                const blob = xhr.response;
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'reporte_ventas_detallado.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } else if (xhr.status === 401) {
                alert('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
                window.location.href = '/login';
            } else {
                const reader = new FileReader();
                reader.onload = function() {
                    try {
                        const errorData = JSON.parse(reader.result as string);
                        alert('Error al generar el PDF: ' + (errorData.message || 'Error desconocido'));
                    } catch (e) {
                        alert('Error al generar el PDF. Por favor, intente nuevamente.');
                    }
                };
                reader.readAsText(xhr.response);
            }
        };

        xhr.onerror = function() {
            alert('Error de conexión al descargar el PDF. Por favor, verifique su conexión a internet.');
        };

        xhr.send();
    }

    exportReporteGeneralPDF(params?: { fecha_desde?: string; fecha_hasta?: string; sucursal_id?: number }): void {
        const token = localStorage.getItem('token');
        
        if (!token) {
            alert('No hay token de autenticación. Por favor, inicie sesión nuevamente.');
            window.location.href = '/login';
            return;
        }

        let url = `${this.apiUrl}/reporte/general-pdf`;
        const queryParams = new URLSearchParams();
        
        if (params?.fecha_desde) {
            queryParams.append('fecha_desde', params.fecha_desde);
        }
        if (params?.fecha_hasta) {
            queryParams.append('fecha_hasta', params.fecha_hasta);
        }
        if (params?.sucursal_id) {
            queryParams.append('sucursal_id', params.sucursal_id.toString());
        }
        
        if (queryParams.toString()) {
            url += '?' + queryParams.toString();
        }

        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Accept', 'application/pdf');
        xhr.responseType = 'blob';

        xhr.onload = function() {
            if (xhr.status === 200) {
                const blob = xhr.response;
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'reporte_ventas_general.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } else if (xhr.status === 401) {
                alert('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
                window.location.href = '/login';
            } else {
                const reader = new FileReader();
                reader.onload = function() {
                    try {
                        const errorData = JSON.parse(reader.result as string);
                        alert('Error al generar el PDF: ' + (errorData.message || 'Error desconocido'));
                    } catch (e) {
                        alert('Error al generar el PDF. Por favor, intente nuevamente.');
                    }
                };
                reader.readAsText(xhr.response);
            }
        };

        xhr.onerror = function() {
            alert('Error de conexión al descargar el PDF. Por favor, verifique su conexión a internet.');
        };

        xhr.send();
    }
}
