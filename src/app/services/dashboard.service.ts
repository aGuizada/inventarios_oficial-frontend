import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DateFilter, ArticuloUtilidad } from '../interfaces/date-filter.interface';


// Interfaces
export interface DashboardKpis {
    // Ventas
    ventas_hoy: number;
    ventas_mes: number;
    ventas_mes_anterior: number;
    total_ventas: number;
    crecimiento_ventas: number;

    // Inventario
    productos_bajo_stock: number;
    productos_agotados: number;
    valor_total_inventario: number;

    // Compras
    compras_mes: number;

    // Créditos
    creditos_pendientes: number;
    monto_creditos_pendientes: number;

    // Análisis
    margen_bruto: number;
}

export interface DashboardAlertas {
    stock_critico: number;
    stock_bajo: number;
    creditos_vencidos: number;
    ventas_hoy: number;
    compras_mes: number;
}

export interface ResumenCajas {
    cajas_abiertas: number;
    cajas_cerradas: number;
    total_efectivo: number;
}

export interface RotacionInventario {
    mejor_rotacion: any[];
    sin_movimiento: any[];
    dias_analisis: number;
}

export interface VentaReciente {
    id: number;
    cliente?: any;
    total: number;
    fecha_hora: string;
    estado: string;
    tipo_venta?: any;
}

export interface ChartData {
    labels: string[];
    data: number[];
}

export interface ComparativaChartData {
    labels: string[];
    ventas: number[];
    compras: number[];
}

export interface ProductoTop {
    articulo_id: number;
    articulo?: any;
    cantidad_vendida: number;
    total_ventas: number;
}

export interface ProductosTopResponse {
    mas_vendidos: ProductoTop[];
    menos_vendidos: ProductoTop[];
}

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private apiUrl = `${environment.apiUrl}/dashboard`;

    constructor(private http: HttpClient) { }

    getKpis(): Observable<DashboardKpis> {
        return this.http.get<DashboardKpis>(`${this.apiUrl}/kpis`);
    }

    getVentasRecientes(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/ventas-recientes`);
    }

    getProductosTop(): Observable<ProductosTopResponse> {
        return this.http.get<ProductosTopResponse>(`${this.apiUrl}/productos-top`);
    }

    getVentasChart(): Observable<ChartData> {
        return this.http.get<ChartData>(`${this.apiUrl}/chart-ventas`);
    }

    getInventarioChart(): Observable<ChartData> {
        return this.http.get<ChartData>(`${this.apiUrl}/chart-inventario`);
    }

    getComparativaChart(): Observable<ComparativaChartData> {
        return this.http.get<ComparativaChartData>(`${this.apiUrl}/chart-comparativa`);
    }

    getProveedoresTop(): Observable<ChartData> {
        return this.http.get<ChartData>(`${this.apiUrl}/proveedores-top`);
    }

    getClientesFrecuentes(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/clientes-frecuentes`);
    }

    getProductosBajoStock(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/productos-bajo-stock`);
    }

    getProductosMasComprados(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/productos-mas-comprados`);
    }

    getTopStock(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/top-stock`);
    }

    // Nuevos endpoints
    getAlertas(): Observable<DashboardAlertas> {
        return this.http.get<DashboardAlertas>(`${this.apiUrl}/alertas`);
    }

    getResumenCajas(): Observable<ResumenCajas> {
        return this.http.get<ResumenCajas>(`${this.apiUrl}/resumen-cajas`);
    }

    getRotacionInventario(): Observable<RotacionInventario> {
        return this.http.get<RotacionInventario>(`${this.apiUrl}/rotacion-inventario`);
    }

    // ====== NUEVOS MÉTODOS CON FILTROS ======

    /**
   * Obtiene lista de sucursales para filtros
   */
    getSucursales(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/sucursales`);
    }

    /**
     * Obtiene KPIs filtrados por fecha y sucursal
     */
    getKpisFiltrados(filtros: DateFilter): Observable<DashboardKpis> {
        let params = this.buildDateFilterParams(filtros);
        return this.http.get<DashboardKpis>(`${this.apiUrl}/kpis-filtrados`, { params });
    }

    /**
     * Obtiene utilidad/ganancia por artículo con filtros opcionales
     */
    getUtilidadArticulos(filtros?: DateFilter): Observable<ArticuloUtilidad[]> {
        let params = new HttpParams();
        if (filtros) {
            params = this.buildDateFilterParams(filtros);
        }
        return this.http.get<ArticuloUtilidad[]>(`${this.apiUrl}/utilidad-articulos`, { params });
    }

    /**
     * Obtiene gráfica de ventas filtrada por fecha
     */
    getVentasChartFiltrado(filtros: DateFilter): Observable<ChartData> {
        let params = this.buildDateFilterParams(filtros);
        return this.http.get<ChartData>(`${this.apiUrl}/chart-ventas-filtrado`, { params });
    }

    /**
     * Método auxiliar para construir parámetros HTTP desde DateFilter
     */
    private buildDateFilterParams(filtros: DateFilter): HttpParams {
        let params = new HttpParams();

        if (filtros.fecha_inicio) {
            params = params.set('fecha_inicio', filtros.fecha_inicio);
        }
        if (filtros.fecha_fin) {
            params = params.set('fecha_fin', filtros.fecha_fin);
        }
        if (filtros.year) {
            params = params.set('year', filtros.year.toString());
        }
        if (filtros.month) {
            params = params.set('month', filtros.month.toString());
        }
        if (filtros.day) {
            params = params.set('day', filtros.day.toString());
        }
        if (filtros.sucursal_id) {
            params = params.set('sucursal_id', filtros.sucursal_id.toString());
        }

        return params;
    }
}
