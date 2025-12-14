import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../../services/dashboard.service';
import { ArticuloUtilidad, DateFilter } from '../../../interfaces/date-filter.interface';

/**
 * Componente para mostrar utilidad/ganancia por artículo
 * Muestra tabla con métricas de rentabilidad y clasificación
 */
@Component({
    selector: 'app-article-profit',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './article-profit.component.html',
    styleUrls: ['./article-profit.component.css']
})
export class ArticleProfitComponent implements OnInit, OnChanges {
    @Input() filtros?: DateFilter;

    utilidades: ArticuloUtilidad[] = [];
    isLoading = false;
    error: string | null = null;

    // Métricas calculadas
    totalUtilidad = 0;
    promedioMargen = 0;
    mejorProducto?: ArticuloUtilidad;
    peorProducto?: ArticuloUtilidad;

    // Paginación
    currentPage = 1;
    itemsPerPage = 10;

    // Ordenamiento
    sortColumn: keyof ArticuloUtilidad = 'utilidad_bruta';
    sortDirection: 'asc' | 'desc' = 'desc';

    constructor(private dashboardService: DashboardService) { }

    ngOnInit(): void {
        this.cargarUtilidadesArticulos();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['filtros'] && !changes['filtros'].firstChange) {
            this.cargarUtilidadesArticulos();
        }
    }

    /**
     * Carga los datos de utilidad por artículo
     */
    cargarUtilidadesArticulos(): void {
        this.isLoading = true;
        this.error = null;

        this.dashboardService.getUtilidadArticulos(this.filtros).subscribe({
            next: (data: any) => {
                // El backend puede envolver en { data: [] } o enviar directamente []
                this.utilidades = Array.isArray(data) ? data : (data.data || []);
                this.calcularMetricas();
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error al cargar utilidades:', err);
                this.error = 'Error al cargar datos de utilidad';
                this.isLoading = false;
            }
        });
    }

    /**
     * Calcula métricas agregadas
     */
    private calcularMetricas(): void {
        if (this.utilidades.length === 0) {
            this.totalUtilidad = 0;
            this.promedioMargen = 0;
            this.mejorProducto = undefined;
            this.peorProducto = undefined;
            return;
        }

        this.totalUtilidad = this.utilidades.reduce((sum, item) => sum + item.utilidad_bruta, 0);
        this.promedioMargen = this.utilidades.reduce((sum, item) => sum + item.margen_porcentaje, 0) / this.utilidades.length;

        this.mejorProducto = this.utilidades.reduce((max, item) =>
            item.utilidad_bruta > max.utilidad_bruta ? item : max
        );

        this.peorProducto = this.utilidades.reduce((min, item) =>
            item.utilidad_bruta < min.utilidad_bruta ? item : min
        );
    }

    /**
     * Obtiene items paginados
     */
    get paginatedItems(): ArticuloUtilidad[] {
        const sorted = this.sortedItems;
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        return sorted.slice(start, end);
    }

    /**
     * Obtiene items ordenados
     */
    get sortedItems(): ArticuloUtilidad[] {
        return [...this.utilidades].sort((a, b) => {
            const aValue = a[this.sortColumn];
            const bValue = b[this.sortColumn];

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return this.sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
            }

            const aStr = String(aValue).toLowerCase();
            const bStr = String(bValue).toLowerCase();
            return this.sortDirection === 'asc'
                ? aStr.localeCompare(bStr)
                : bStr.localeCompare(aStr);
        });
    }

    /**
     * Ordena por columna
     */
    sortBy(column: keyof ArticuloUtilidad): void {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'desc';
        }
    }

    /**
     * Cambia de página
     */
    changePage(page: number): void {
        this.currentPage = page;
    }

    /**
     * Obtiene número total de páginas
     */
    get totalPages(): number {
        return Math.ceil(this.utilidades.length / this.itemsPerPage);
    }

    /**
     * Obtiene clase CSS según rentabilidad
     */
    getRentabilidadClass(rentabilidad: string): string {
        const classes: { [key: string]: string } = {
            'alta': 'rentabilidad-alta',
            'media': 'rentabilidad-media',
            'baja': 'rentabilidad-baja',
            'muy_baja': 'rentabilidad-muy-baja'
        };
        return classes[rentabilidad] || '';
    }

    /**
     * Obtiene etiqueta de rentabilidad
     */
    getRentabilidadLabel(rentabilidad: string): string {
        const labels: { [key: string]: string } = {
            'alta': 'Alta',
            'media': 'Media',
            'baja': 'Baja',
            'muy_baja': 'Muy Baja'
        };
        return labels[rentabilidad] || rentabilidad;
    }

    /**
     * Exporta datos a CSV
     */
    exportarCSV(): void {
        const headers = ['Código', 'Nombre', 'Cantidad', 'Ventas', 'Costo', 'Utilidad', 'Margen %', 'Rentabilidad'];
        const rows = this.utilidades.map(item => [
            item.codigo,
            item.nombre,
            item.cantidad_vendida,
            item.total_ventas,
            item.costo_total,
            item.utilidad_bruta,
            item.margen_porcentaje,
            this.getRentabilidadLabel(item.rentabilidad)
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `utilidad_articulos_${new Date().getTime()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
