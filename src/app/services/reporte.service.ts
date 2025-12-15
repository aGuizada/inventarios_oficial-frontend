import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ReporteVentas {
    periodo: { fecha_desde: string; fecha_hasta: string };
    resumen: {
        total_ventas: number;
        cantidad_transacciones: number;
        ticket_promedio: number;
    };
    metodos_pago: any[];
    ventas_por_dia: any[];
    productos_top: any[];
    ventas: any[];
}

export interface ReporteCompras {
    periodo: { fecha_desde: string; fecha_hasta: string };
    resumen: {
        total_compras: number;
        cantidad_compras: number;
        promedio_compra: number;
    };
    compras_por_dia: any[];
    proveedores_top: any[];
    compras: any[];
}

export interface ReporteInventario {
    resumen: {
        total_items: number;
        stock_critico: number;
        stock_agotado: number;
        valor_total: number;
    };
    por_categoria: any[];
    inventarios: any[];
}

export interface ReporteCreditos {
    resumen: {
        total_creditos: number;
        monto_total: number;
        creditos_pendientes: number;
        monto_pendiente: number;
        creditos_vencidos: number;
    };
    por_estado: any[];
    creditos: any[];
}

@Injectable({
    providedIn: 'root'
})
export class ReporteService {
    private apiUrl = `${environment.apiUrl}/reportes`;

    constructor(private http: HttpClient) { }

    // Reporte de Ventas
    getReporteVentas(params: any): Observable<{ success: boolean; data: ReporteVentas }> {
        const httpParams = this.buildParams(params);
        return this.http.get<{ success: boolean; data: ReporteVentas }>(`${this.apiUrl}/ventas`, { params: httpParams });
    }

    exportVentasExcel(params: any): void {
        const url = `${this.apiUrl}/ventas/export-excel?${this.buildParamsString(params)}`;
        window.open(url, '_blank');
    }

    exportVentasPDF(params: any): void {
        const url = `${this.apiUrl}/ventas/export-pdf?${this.buildParamsString(params)}`;
        window.open(url, '_blank');
    }

    // Reporte de Compras
    getReporteCompras(params: any): Observable<{ success: boolean; data: ReporteCompras }> {
        const httpParams = this.buildParams(params);
        return this.http.get<{ success: boolean; data: ReporteCompras }>(`${this.apiUrl}/compras`, { params: httpParams });
    }

    exportComprasExcel(params: any): void {
        const url = `${this.apiUrl}/compras/export-excel?${this.buildParamsString(params)}`;
        window.open(url, '_blank');
    }

    // Reporte de Inventario
    getReporteInventario(params?: any): Observable<{ success: boolean; data: ReporteInventario }> {
        const httpParams = this.buildParams(params || {});
        return this.http.get<{ success: boolean; data: ReporteInventario }>(`${this.apiUrl}/inventario`, { params: httpParams });
    }

    exportInventarioExcel(params?: any): void {
        const url = `${this.apiUrl}/inventario/export-excel?${this.buildParamsString(params || {})}`;
        window.open(url, '_blank');
    }

    // Reporte de Créditos
    getReporteCreditos(params?: any): Observable<{ success: boolean; data: ReporteCreditos }> {
        const httpParams = this.buildParams(params || {});
        return this.http.get<{ success: boolean; data: ReporteCreditos }>(`${this.apiUrl}/creditos`, { params: httpParams });
    }

    // Otros reportes (legacy - mantener compatibilidad)
    getProductosMasVendidos(params?: any): Observable<{ success: boolean; data: any[] }> {
        const httpParams = this.buildParams(params || {});
        return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/productos-mas-vendidos`, { params: httpParams });
    }

    getStockBajo(almacenId?: number): Observable<{ success: boolean; data: any[] }> {
        let httpParams = new HttpParams();
        if (almacenId) {
            httpParams = httpParams.set('almacen_id', almacenId.toString());
        }
        return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/stock-bajo`, { params: httpParams });
    }

    getReporteUtilidad(params: any): Observable<{ success: boolean; data: any }> {
        const httpParams = this.buildParams(params);
        return this.http.get<{ success: boolean; data: any }>(`${this.apiUrl}/utilidad`, { params: httpParams });
    }

    // Reporte de Utilidades por Sucursal
    getUtilidadesPorSucursal(params: any): Observable<{ success: boolean; data: any[] }> {
        const httpParams = this.buildParams(params);
        return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/utilidades-sucursal`, { params: httpParams });
    }

    exportUtilidadesSucursalExcel(params: any): void {
        const url = `${this.apiUrl}/utilidades-sucursal/export-excel?${this.buildParamsString(params)}`;
        window.open(url, '_blank');
    }

    exportUtilidadesSucursalPDF(params: any): void {
        const url = `${this.apiUrl}/utilidades-sucursal/export-pdf?${this.buildParamsString(params)}`;
        window.open(url, '_blank');
    }

    // Reporte de Cajas por Sucursal
    getCajasPorSucursal(params: any): Observable<{ success: boolean; data: any[] }> {
        const httpParams = this.buildParams(params);
        return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/cajas-sucursal`, { params: httpParams });
    }

    exportCajasSucursalExcel(params: any): void {
        const url = `${this.apiUrl}/cajas-sucursal/export-excel?${this.buildParamsString(params)}`;
        window.open(url, '_blank');
    }

    exportCajasSucursalPDF(params: any): void {
        const url = `${this.apiUrl}/cajas-sucursal/export-pdf?${this.buildParamsString(params)}`;
        window.open(url, '_blank');
    }

    // Helpers
    private buildParams(params: any): HttpParams {
        let httpParams = new HttpParams();
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                httpParams = httpParams.set(key, params[key].toString());
            }
        });
        return httpParams;
    }

    private buildParamsString(params: any): string {
        const urlParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                urlParams.append(key, params[key]);
            }
        });
        return urlParams.toString();
    }
}
