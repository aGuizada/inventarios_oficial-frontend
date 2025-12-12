import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KardexService, KardexResumen } from '../../../services/kardex.service';
import { ArticuloService } from '../../../services/articulo.service';
import { AlmacenService } from '../../../services/almacen.service';
import { Kardex, Articulo, Almacen } from '../../../interfaces';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'app-kardex',
    standalone: true,
    imports: [CommonModule, FormsModule, PaginationComponent],
    templateUrl: './kardex.component.html'
})
export class KardexComponent implements OnInit {
    // Vista activa
    vistaActual: 'fisico' | 'valorado' = 'fisico';

    // Datos
    kardexMovimientos: Kardex[] = [];
    articulos: Articulo[] = [];
    almacenes: Almacen[] = [];

    // Resumen del backend
    resumen: KardexResumen | null = null;

    // Filtros
    articuloSeleccionado: number | null = null;
    almacenSeleccionado: number | null = null;
    tipoMovimiento: string = '';
    fechaDesde: string = '';
    fechaHasta: string = '';

    // Paginación
    currentPage = 1;
    lastPage = 1;
    total = 0;
    perPage = 20;

    // Estados
    isLoading = false;
    isLoadingResumen = false;
    searchTerm = '';

    // Nuevo: Modal de ajuste
    mostrarModalAjuste = false;
    nuevoAjuste: any = {
        fecha: new Date().toISOString().split('T')[0],
        tipo_movimiento: 'ajuste',
        articulo_id: null,
        almacen_id: null,
        cantidad_entrada: null,
        cantidad_salida: null,
        costo_unitario: 0,
        observaciones: '',
        motivo: ''
    };

    constructor(
        private kardexService: KardexService,
        private articuloService: ArticuloService,
        private almacenService: AlmacenService
    ) { }

    ngOnInit(): void {
        this.loadArticulos();
        this.loadAlmacenes();
        this.loadKardex();
        this.loadResumen();
    }

    loadArticulos(): void {
        this.articuloService.getAll().subscribe({
            next: (response: any) => {
                this.articulos = Array.isArray(response) ? response : (response.data || []);
            },
            error: (error) => console.error('Error cargando artículos:', error)
        });
    }

    loadAlmacenes(): void {
        this.almacenService.getAll().subscribe({
            next: (response: any) => {
                this.almacenes = Array.isArray(response) ? response : (response.data || []);
            },
            error: (error) => console.error('Error cargando almacenes:', error)
        });
    }

    loadKardex(): void {
        this.isLoading = true;
        const params = this.construirParametros();

        // Usar endpoint según vista
        const observable = this.vistaActual === 'valorado'
            ? this.kardexService.getKardexValorado(params)
            : this.kardexService.getPaginated(params);

        observable.pipe(
            finalize(() => this.isLoading = false)
        ).subscribe({
            next: (response) => {
                if (response.data?.data) {
                    this.kardexMovimientos = response.data.data;
                    this.currentPage = response.data.current_page;
                    this.lastPage = response.data.last_page;
                    this.total = response.data.total;
                }
            },
            error: (error) => {
                console.error('Error cargando kardex:', error);
            }
        });
    }

    loadResumen(): void {
        this.isLoadingResumen = true;
        const filtros = this.construirFiltros();

        this.kardexService.getResumen(filtros).pipe(
            finalize(() => this.isLoadingResumen = false)
        ).subscribe({
            next: (response) => {
                this.resumen = response.data;
            },
            error: (error) => {
                console.error('Error cargando resumen:', error);
            }
        });
    }

    construirParametros(): any {
        const params: any = {
            page: this.currentPage,
            per_page: this.perPage
        };

        if (this.articuloSeleccionado) params.articulo_id = this.articuloSeleccionado;
        if (this.almacenSeleccionado) params.almacen_id = this.almacenSeleccionado;
        if (this.tipoMovimiento) params.tipo_movimiento = this.tipoMovimiento;
        if (this.fechaDesde) params.fecha_desde = this.fechaDesde;
        if (this.fechaHasta) params.fecha_hasta = this.fechaHasta;
        if (this.searchTerm) params.search = this.searchTerm;

        return params;
    }

    construirFiltros(): any {
        const filtros: any = {};
        if (this.articuloSeleccionado) filtros.articulo_id = this.articuloSeleccionado;
        if (this.almacenSeleccionado) filtros.almacen_id = this.almacenSeleccionado;
        if (this.tipoMovimiento) filtros.tipo_movimiento = this.tipoMovimiento;
        if (this.fechaDesde) filtros.fecha_desde = this.fechaDesde;
        if (this.fechaHasta) filtros.fecha_hasta = this.fechaHasta;
        return filtros;
    }

    aplicarFiltros(): void {
        this.currentPage = 1;
        this.loadKardex();
        this.loadResumen();
    }

    limpiarFiltros(): void {
        this.articuloSeleccionado = null;
        this.almacenSeleccionado = null;
        this.tipoMovimiento = '';
        this.fechaDesde = '';
        this.fechaHasta = '';
        this.searchTerm = '';
        this.aplicarFiltros();
    }

    cambiarVista(vista: 'fisico' | 'valorado'): void {
        this.vistaActual = vista;
        this.currentPage = 1;
        this.loadKardex();
    }

    onPageChange(page: number): void {
        this.currentPage = page;
        this.loadKardex();
    }

    onSearch(search: string): void {
        this.searchTerm = search;
        this.currentPage = 1;
        this.loadKardex();
    }

    // Nuevo: Modal de ajuste
    abrirModalAjuste(): void {
        this.nuevoAjuste = {
            fecha: new Date().toISOString().split('T')[0],
            tipo_movimiento: 'ajuste',
            articulo_id: null,
            almacen_id: null,
            cantidad_entrada: null,
            cantidad_salida: null,
            costo_unitario: 0,
            observaciones: '',
            motivo: ''
        };
        this.mostrarModalAjuste = true;
    }

    cerrarModalAjuste(): void {
        this.mostrarModalAjuste = false;
    }

    guardarAjuste(): void {
        // Validar datos
        if (!this.nuevoAjuste.articulo_id || !this.nuevoAjuste.almacen_id) {
            alert('Debe seleccionar artículo y almacén');
            return;
        }

        if (!this.nuevoAjuste.cantidad_entrada && !this.nuevoAjuste.cantidad_salida) {
            alert('Debe especificar cantidad de entrada o salida');
            return;
        }

        this.isLoading = true;
        this.kardexService.create(this.nuevoAjuste).pipe(
            finalize(() => this.isLoading = false)
        ).subscribe({
            next: (response) => {
                if (response.success) {
                    alert('Ajuste registrado exitosamente');
                    this.cerrarModalAjuste();
                    this.loadKardex();
                    this.loadResumen();
                }
            },
            error: (error) => {
                console.error('Error guardando ajuste:', error);
                alert(error.error?.message || 'Error al guardar ajuste');
            }
        });
    }

    // Exportar - ahora desde backend
    exportarExcel(): void {
        const filtros = this.construirFiltros();
        filtros.tipo = this.vistaActual;

        const params = new URLSearchParams();
        Object.keys(filtros).forEach(key => {
            if (filtros[key]) {
                params.append(key, filtros[key]);
            }
        });

        const url = `${this.kardexService['apiUrl']}/export-excel?${params.toString()}`;
        window.open(url, '_blank');
    }

    exportarPDF(): void {
        const filtros = this.construirFiltros();
        filtros.tipo = this.vistaActual;

        const params = new URLSearchParams();
        Object.keys(filtros).forEach(key => {
            if (filtros[key]) {
                params.append(key, filtros[key]);
            }
        });

        const url = `${this.kardexService['apiUrl']}/export-pdf?${params.toString()}`;
        window.open(url, '_blank');
    }

    // Helpers
    getTipoMovimientoClass(tipo: string): string {
        const classes: any = {
            'compra': 'bg-blue-100 text-blue-800',
            'venta': 'bg-green-100 text-green-800',
            'ajuste': 'bg-yellow-100 text-yellow-800',
            'traspaso_entrada': 'bg-purple-100 text-purple-800',
            'traspaso_salida': 'bg-orange-100 text-orange-800'
        };
        return classes[tipo] || 'bg-gray-100 text-gray-800';
    }

    getNombreArticulo(id: number): string {
        const articulo = this.articulos.find(a => a.id === id);
        return articulo?.nombre || `ID: ${id}`;
    }

    getNombreAlmacen(id: number): string {
        const almacen = this.almacenes.find(a => a.id === id);
        return almacen?.nombre_almacen || `ID: ${id}`;
    }
}
