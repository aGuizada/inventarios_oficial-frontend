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
        this.downloadFile(`${this.apiUrl}/ventas/export-excel`, params, 'reporte_ventas.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    exportVentasPDF(params: any): void {
        this.downloadFile(`${this.apiUrl}/ventas/export-pdf`, params, 'reporte_ventas.pdf', 'application/pdf');
    }

    // Reporte de Compras
    getReporteCompras(params: any): Observable<{ success: boolean; data: ReporteCompras }> {
        const httpParams = this.buildParams(params);
        return this.http.get<{ success: boolean; data: ReporteCompras }>(`${this.apiUrl}/compras`, { params: httpParams });
    }

    exportComprasExcel(params: any): void {
        this.downloadFile(`${this.apiUrl}/compras/export-excel`, params, 'reporte_compras.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    // Reporte de Inventario
    getReporteInventario(params?: any): Observable<{ success: boolean; data: ReporteInventario }> {
        const httpParams = this.buildParams(params || {});
        return this.http.get<{ success: boolean; data: ReporteInventario }>(`${this.apiUrl}/inventario`, { params: httpParams });
    }

    exportInventarioExcel(params?: any): void {
        this.downloadFile(`${this.apiUrl}/inventario/export-excel`, params || {}, 'reporte_inventario.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
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
        this.downloadFile(`${this.apiUrl}/utilidades-sucursal/export-excel`, params, 'reporte_utilidades_sucursal.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    exportUtilidadesSucursalPDF(params: any): void {
        this.downloadFile(`${this.apiUrl}/utilidades-sucursal/export-pdf`, params, 'reporte_utilidades_sucursal.pdf', 'application/pdf');
    }

    // Reporte de Cajas por Sucursal
    getCajasPorSucursal(params: any): Observable<{ success: boolean; data: any[] }> {
        const httpParams = this.buildParams(params);
        return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/cajas-sucursal`, { params: httpParams });
    }

    exportCajasSucursalExcel(params: any): void {
        this.downloadFile(`${this.apiUrl}/cajas-sucursal/export-excel`, params, 'reporte_cajas_sucursal.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    exportCajasSucursalPDF(params: any): void {
        this.downloadFile(`${this.apiUrl}/cajas-sucursal/export-pdf`, params, 'reporte_cajas_sucursal.pdf', 'application/pdf');
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

    /**
     * Método genérico para descargar archivos con autenticación
     */
    private downloadFile(url: string, params: any, filename: string, expectedContentType: string): void {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('No hay token de autenticación. Por favor, inicie sesión nuevamente.');
            window.location.href = '/login';
            return;
        }

        const queryString = this.buildParamsString(params);
        const fullUrl = queryString ? `${url}?${queryString}` : url;

        const xhr = new XMLHttpRequest();
        xhr.open('GET', fullUrl, true);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        if (expectedContentType.includes('pdf')) {
            xhr.setRequestHeader('Accept', 'application/pdf');
        }
        xhr.responseType = 'blob';

        xhr.onload = function() {
            if (xhr.status === 200) {
                const contentType = xhr.getResponseHeader('Content-Type');
                if (contentType && (contentType.includes(expectedContentType) || 
                    (expectedContentType.includes('spreadsheetml') && (contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') || contentType.includes('application/vnd.ms-excel'))) ||
                    (expectedContentType.includes('pdf') && contentType.includes('application/pdf')))) {
                    const blob = xhr.response;
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                } else {
                    const reader = new FileReader();
                    reader.onload = function() {
                        try {
                            const errorData = JSON.parse(reader.result as string);
                            alert('Error al generar el archivo: ' + (errorData.message || 'Error desconocido'));
                        } catch (e) {
                            alert('Error al generar el archivo. Por favor, intente nuevamente.');
                        }
                    };
                    reader.readAsText(xhr.response);
                }
            } else if (xhr.status === 401) {
                alert('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
                window.location.href = '/login';
            } else {
                alert('Error al descargar el archivo. Código de error: ' + xhr.status);
            }
        };
        xhr.onerror = function() {
            alert('Error de conexión al descargar el archivo.');
        };
        xhr.send();
    }
}
