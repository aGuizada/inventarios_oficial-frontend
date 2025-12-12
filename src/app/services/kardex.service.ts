import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Kardex, ApiResponse, PaginatedResponse, PaginationParams } from '../interfaces';
import { environment } from '../../environments/environment';

// Interfaces para nuevos endpoints
export interface KardexResumen {
    total_movimientos: number;
    total_entradas: number;
    total_salidas: number;
    saldo_neto: number;
    total_costos: number;
    total_ventas: number;
    margen: number;
    articulos_unicos: number;
    movimientos_por_tipo: Array<{ tipo_movimiento: string, cantidad: number }>;
}

export interface KardexReporte {
    articulo: any;
    periodo: {
        fecha_desde: string | null;
        fecha_hasta: string | null;
    };
    saldo_inicial: number;
    total_entradas: number;
    total_salidas: number;
    saldo_final: number;
    movimientos: Kardex[];
    estadisticas: {
        total_movimientos: number;
        valor_entradas: number;
        valor_salidas: number;
    };
}

@Injectable({
    providedIn: 'root'
})
export class KardexService {
    private apiUrl = `${environment.apiUrl}/kardex`;

    constructor(private http: HttpClient) { }

    /**
     * Obtiene todos los movimientos de kardex con paginación
     */
    getAll(params?: any): Observable<ApiResponse<Kardex[]>> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined) {
                    httpParams = httpParams.set(key, params[key]);
                }
            });
        }
        return this.http.get<ApiResponse<Kardex[]>>(this.apiUrl, { params: httpParams });
    }

    /**
     * Obtiene kardex paginado
     */
    getPaginated(params?: any): Observable<ApiResponse<PaginatedResponse<Kardex>>> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                const value = (params as any)[key];
                if (value !== undefined && value !== null) {
                    httpParams = httpParams.set(key, value.toString());
                }
            });
        }
        return this.http.get<ApiResponse<PaginatedResponse<Kardex>>>(this.apiUrl, { params: httpParams });
    }

    /**
     * Obtiene resumen con KPIs  
     */
    getResumen(filtros?: any): Observable<ApiResponse<KardexResumen>> {
        let httpParams = new HttpParams();
        if (filtros) {
            Object.keys(filtros).forEach(key => {
                const value = (filtros as any)[key];
                if (value !== undefined && value !== null) {
                    httpParams = httpParams.set(key, value.toString());
                }
            });
        }
        return this.http.get<ApiResponse<KardexResumen>>(`${this.apiUrl}/resumen`, { params: httpParams });
    }

    /**
     * Obtiene kardex valorado (con precios)
     */
    getKardexValorado(filtros?: any): Observable<ApiResponse<PaginatedResponse<Kardex>>> {
        let httpParams = new HttpParams();
        if (filtros) {
            Object.keys(filtros).forEach(key => {
                const value = (filtros as any)[key];
                if (value !== undefined && value !== null) {
                    httpParams = httpParams.set(key, value.toString());
                }
            });
        }
        return this.http.get<ApiResponse<PaginatedResponse<Kardex>>>(`${this.apiUrl}/valorado`, { params: httpParams });
    }

    /**
     * Genera reporte detallado por artículo
     */
    getReportePorArticulo(articuloId: number, filtros?: any): Observable<ApiResponse<KardexReporte>> {
        let httpParams = new HttpParams();
        if (filtros) {
            Object.keys(filtros).forEach(key => {
                const value = (filtros as any)[key];
                if (value !== undefined && value !== null) {
                    httpParams = httpParams.set(key, value.toString());
                }
            });
        }
        return this.http.get<ApiResponse<KardexReporte>>(`${this.apiUrl}/reporte/${articuloId}`, { params: httpParams });
    }

    /**
     * Obtiene totales calculados
     */
    getTotales(params?: any): Observable<any> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined) {
                    httpParams = httpParams.set(key, params[key]);
                }
            });
        }
        return this.http.get<any>(`${this.apiUrl}/totales`, { params: httpParams });
    }

    /**
     * Obtiene kardex de un artículo específico
     */
    getPorArticulo(articuloId: number, filtros?: any): Observable<any> {
        let httpParams = new HttpParams();
        if (filtros) {
            Object.keys(filtros).forEach(key => {
                const value = (filtros as any)[key];
                if (value !== undefined && value !== null) {
                    httpParams = httpParams.set(key, value.toString());
                }
            });
        }
        return this.http.get(`${this.apiUrl}/por-articulo/${articuloId}`, { params: httpParams });
    }

    /**
     * Crea un movimiento manual (ajuste)
     */
    create(kardex: Partial<Kardex>): Observable<ApiResponse<Kardex>> {
        return this.http.post<ApiResponse<Kardex>>(this.apiUrl, kardex);
    }

    /**
     * Recalcula saldos del kardex
     */
    recalcular(articuloId: number, almacenId: number): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/recalcular`, {
            articulo_id: articuloId,
            almacen_id: almacenId
        });
    }

    /**
     * Obtiene un movimiento específico
     */
    getById(id: number): Observable<ApiResponse<Kardex>> {
        return this.http.get<ApiResponse<Kardex>>(`${this.apiUrl}/${id}`);
    }
}
