import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../../services/reporte.service';

@Component({
    selector: 'app-reportes',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './reportes.component.html'
})
export class ReportesComponent implements OnInit {
    // Vista activa
    vistaActual: 'ventas' | 'compras' | 'productos' | 'stock' | 'utilidad' = 'ventas';

    // Filtros
    fechaDesde: string = '';
    fechaHasta: string = '';

    // Datos
    reporteVentas: any = null;
    reporteCompras: any = null;
    productosMasVendidos: any[] = [];
    stockBajo: any[] = [];
    reporteUtilidad: any;
    reporteData: any = null;
    isLoading: boolean = false;
    showFilters: boolean = false;

    toggleFilters(): void {
        this.showFilters = !this.showFilters;
    }

    constructor(private reporteService: ReporteService) {
        // Fechas por defecto: último mes
        const hoy = new Date();
        const hace30Dias = new Date();
        hace30Dias.setDate(hoy.getDate() - 30);

        this.fechaHasta = hoy.toISOString().split('T')[0];
        this.fechaDesde = hace30Dias.toISOString().split('T')[0];
    }

    ngOnInit(): void {
        this.cargarReporte();
    }

    cambiarVista(vista: typeof this.vistaActual): void {
        this.vistaActual = vista;
        this.cargarReporte();
    }

    cargarReporte(): void {
        switch (this.vistaActual) {
            case 'ventas':
                this.cargarReporteVentas();
                break;
            case 'compras':
                this.cargarReporteCompras();
                break;
            case 'productos':
                this.cargarProductosMasVendidos();
                break;
            case 'stock':
                this.cargarStockBajo();
                break;
            case 'utilidad':
                this.cargarUtilidad();
                break;
        }
    }

    cargarReporteVentas(): void {
        this.isLoading = true;
        const params = {
            fecha_desde: this.fechaDesde,
            fecha_hasta: this.fechaHasta
        };

        this.reporteService.getReporteVentas(params).subscribe({
            next: (response: any) => {
                if (response.success) {
                    this.reporteData = response.data;
                }
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error cargando reporte de ventas:', error);
                this.isLoading = false;
            }
        });
    }

    cargarReporteCompras(): void {
        this.isLoading = true;
        const params = {
            fecha_desde: this.fechaDesde,
            fecha_hasta: this.fechaHasta
        };

        this.reporteService.getReporteCompras(params).subscribe({
            next: (response: any) => {
                this.reporteCompras = response.data;
                this.isLoading = false;
            },
            error: (error: any) => {
                console.error('Error cargando reporte de compras:', error);
                this.isLoading = false;
            }
        });
    }

    cargarProductosMasVendidos(): void {
        this.isLoading = true;
        const params = {
            fecha_desde: this.fechaDesde,
            fecha_hasta: this.fechaHasta,
            limite: 20
        };

        this.reporteService.getProductosMasVendidos(params).subscribe({
            next: (response: any) => {
                this.productosMasVendidos = response.data;
                this.isLoading = false;
            },
            error: (error: any) => {
                console.error('Error cargando productos más vendidos:', error);
                this.isLoading = false;
            }
        });
    }

    cargarStockBajo(): void {
        this.isLoading = true;

        this.reporteService.getStockBajo().subscribe({
            next: (response: any) => {
                this.stockBajo = response.data;
                this.isLoading = false;
            },
            error: (error: any) => {
                console.error('Error cargando stock bajo:', error);
                this.isLoading = false;
            }
        });
    }

    cargarUtilidad(): void {
        this.isLoading = true;
        const params = {
            fecha_desde: this.fechaDesde,
            fecha_hasta: this.fechaHasta
        };

        this.reporteService.getReporteUtilidad(params).subscribe({
            next: (response: any) => {
                this.reporteUtilidad = response.data;
                this.isLoading = false;
            },
            error: (error: any) => {
                console.error('Error cargando reporte de utilidad:', error);
                this.isLoading = false;
            }
        });
    }

    getColorEstado(estado: string): string {
        const colores: any = {
            'agotado': 'bg-red-100 text-red-800',
            'critico': 'bg-orange-100 text-orange-800',
            'bajo': 'bg-yellow-100 text-yellow-800'
        };
        return colores[estado] || 'bg-gray-100 text-gray-800';
    }

    getDiferenciaClase(diferencia: number): string {
        return diferencia >= 0 ? 'text-green-600' : 'text-red-600';
    }

    // Exportaciones - Ahora desde backend
    exportarVentasExcel(): void {
        const params = {
            fecha_desde: this.fechaDesde,
            fecha_hasta: this.fechaHasta
        };
        this.reporteService.exportVentasExcel(params);
    }

    exportarVentasPDF(): void {
        const params = {
            fecha_desde: this.fechaDesde,
            fecha_hasta: this.fechaHasta
        };
        this.reporteService.exportVentasPDF(params);
    }

    exportarComprasExcel(): void {
        const params = {
            fecha_desde: this.fechaDesde,
            fecha_hasta: this.fechaHasta
        };
        this.reporteService.exportComprasExcel(params);
    }

    exportarInventarioExcel(): void {
        this.reporteService.exportInventarioExcel();
    }
}
