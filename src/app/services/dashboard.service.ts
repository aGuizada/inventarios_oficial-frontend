import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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
}
