import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonedaPipe } from '../../../../../../pipes/moneda.pipe';
import { FormsModule } from '@angular/forms';
import { Categoria } from '../../../../../../interfaces';
import { ProductoInventario } from '../../../../../../services/venta.service';
import { environment } from '../../../../../../../environments/environment';

import { ArticuloDetailComponent } from '../../../../../inventory/articulos/articulo-detail/articulo-detail.component';

@Component({
    selector: 'app-product-list',
    standalone: true,
    imports: [CommonModule, FormsModule, MonedaPipe, ArticuloDetailComponent],
    templateUrl: './product-list.component.html',
})
export class ProductListComponent implements OnChanges {
    @Input() almacenId: number | null = null;
    @Input() productosInventario: ProductoInventario[] = [];
    @Input() categorias: Categoria[] = [];
    @Input() hasCart: boolean = false;

    // Paginación
    @Input() currentPage: number = 1;
    @Input() lastPage: number = 1;
    @Input() isLoadingMore: boolean = false;
    @Input() searchTerm: string = '';

    @Output() addProduct = new EventEmitter<ProductoInventario>();
    @Output() search = new EventEmitter<string>();
    @Output() categoryChange = new EventEmitter<number | null>();
    @Output() pageChange = new EventEmitter<number>();


    busquedaProducto: string = '';
    productoSeleccionado: ProductoInventario | null = null;
    mostrarSugerenciasProducto: boolean = false;

    productosFiltrados: ProductoInventario[] = [];
    categoriaSeleccionada: number | null = null;

    selectedProductForDetail: ProductoInventario | null = null;
    isDetailModalOpen: boolean = false;

    private searchTimeout: any;

    getImageUrl(producto: ProductoInventario): string {
        if (producto.articulo?.fotografia) {
            const baseUrl = environment.apiUrl.replace('/api', '');
            return `${baseUrl}/storage/${producto.articulo.fotografia}`;
        }
        return '/assets/images/no-image.jpg';
    }

    openProductDetail(producto: ProductoInventario, event?: Event): void {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        this.selectedProductForDetail = producto;
        this.isDetailModalOpen = true;
    }

    closeProductDetail(): void {
        this.isDetailModalOpen = false;
        this.selectedProductForDetail = null;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['productosInventario']) {
            this.productosFiltrados = this.productosInventario;
        }
        if (changes['searchTerm']) {
            this.busquedaProducto = this.searchTerm;
        }
    }

    buscarProducto(event: any): void {
        const valor = event.target.value.trim();
        this.busquedaProducto = valor;

        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        this.searchTimeout = setTimeout(() => {
            this.search.emit(valor);
        }, 400);
    }

    aplicarFiltros(): void {
        // La lógica de filtrado ahora es manejada por el padre (VentaFormComponent)
        // a través de los eventos emitidos (search, categoryChange)
    }

    seleccionarCategoria(categoriaId: number | null, event?: Event): void {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        this.categoriaSeleccionada = categoriaId;
        this.categoryChange.emit(categoriaId);
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.lastPage && page !== this.currentPage) {
            this.pageChange.emit(page);
        }
    }

    getPages(): number[] {
        const pages: number[] = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(this.lastPage, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    }

    seleccionarProductoCatalogo(producto: ProductoInventario, event?: Event): void {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        this.productoSeleccionado = producto;
        this.busquedaProducto = producto.articulo?.nombre || '';
        this.mostrarSugerenciasProducto = false;
    }

    limpiarBusquedaProducto(event?: Event): void {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        this.productoSeleccionado = null;
        this.busquedaProducto = '';
        this.aplicarFiltros();
    }

    onFocusProducto(): void {
        if (this.busquedaProducto.length > 0) {
            this.buscarProducto({ target: { value: this.busquedaProducto } });
        }
    }

    onBlurProducto(): void {
        setTimeout(() => {
            this.mostrarSugerenciasProducto = false;
        }, 200);
    }

    agregarProductoAVenta(producto?: ProductoInventario | null, event?: Event): void {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        const productoAAgregar = producto || this.productoSeleccionado;

        if (!productoAAgregar) {
            if (this.busquedaProducto) {
                this.agregarRapidoPorCodigo({ key: 'Enter' } as any);
                return;
            }
            alert('Por favor seleccione un producto del catálogo');
            return;
        }

        this.addProduct.emit(productoAAgregar);
        this.limpiarBusquedaProducto();
    }

    agregarRapidoPorCodigo(event: any): void {
        if (event.key === 'Enter' && this.busquedaProducto.trim()) {
            const codigo = this.busquedaProducto.trim().toLowerCase();
            const producto = this.productosInventario.find(p =>
                p.articulo?.codigo?.toLowerCase() === codigo
            );

            if (producto) {
                this.agregarProductoAVenta(producto);
            } else {
                if (this.productosFiltrados.length === 1) {
                    this.agregarProductoAVenta(this.productosFiltrados[0]);
                }
            }
        }
    }

    trackByProducto(index: number, item: ProductoInventario): number {
        return item.inventario_id;
    }

    trackByCategoria(index: number, item: Categoria): number {
        return item.id;
    }

    getBadgeClass(unitName: string | undefined): string {
        const unit = (unitName || '').toLowerCase();
        if (unit.includes('paquete') || unit.includes('caja')) {
            return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
        } else if (unit.includes('centimetro') || unit.includes('metro')) {
            return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300';
        } else if (unit.includes('litro') || unit.includes('ml')) {
            return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300';
        } else if (unit.includes('kilo') || unit.includes('gramo')) {
            return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
        } else {
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
        }
    }
}
