import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Categoria } from '../../../../../../interfaces';
import { ProductoInventario } from '../../../../../../services/venta.service';

import { ArticuloDetailComponent } from '../../../../../inventory/articulos/articulo-detail/articulo-detail.component';

@Component({
    selector: 'app-product-list',
    standalone: true,
    imports: [CommonModule, FormsModule, ArticuloDetailComponent],
    templateUrl: './product-list.component.html',
})
export class ProductListComponent implements OnChanges {
    @Input() almacenId: number | null = null;
    @Input() productosInventario: ProductoInventario[] = [];
    @Input() categorias: Categoria[] = [];
    @Output() addProduct = new EventEmitter<ProductoInventario>();


    busquedaProducto: string = '';
    productoSeleccionado: ProductoInventario | null = null;
    mostrarSugerenciasProducto: boolean = false;

    productosFiltrados: ProductoInventario[] = [];
    productosFiltradosPorCategoria: ProductoInventario[] = [];
    categoriaSeleccionada: number | null = null;

    selectedProductForDetail: ProductoInventario | null = null;
    isDetailModalOpen: boolean = false;

    openProductDetail(producto: ProductoInventario): void {
        this.selectedProductForDetail = producto;
        this.isDetailModalOpen = true;
    }

    closeProductDetail(): void {
        this.isDetailModalOpen = false;
        this.selectedProductForDetail = null;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['productosInventario'] || changes['almacenId']) {
            this.aplicarFiltros();
        }
    }

    buscarProducto(event: any): void {
        const valor = event.target.value.toLowerCase().trim();
        this.busquedaProducto = valor;
        this.aplicarFiltros();
    }

    aplicarFiltros(): void {
        let productos = [...this.productosInventario];

        // Filtro por categoría
        if (this.categoriaSeleccionada) {
            productos = productos.filter(producto =>
                producto.articulo?.categoria_id === this.categoriaSeleccionada
            );
        }

        // Filtro por búsqueda de texto
        if (this.busquedaProducto.length > 0) {
            const busqueda = this.busquedaProducto.toLowerCase();
            productos = productos.filter(producto =>
                producto.articulo?.nombre?.toLowerCase().includes(busqueda) ||
                producto.articulo?.codigo?.toLowerCase().includes(busqueda)
            );
        }

        this.productosFiltrados = productos;
        // Si hay búsqueda, mostramos los filtrados por texto, si no, los filtrados por categoría (para el grid principal)
        // En el template original: (productosFiltradosPorCategoria.length > 0 ? productosFiltradosPorCategoria : productosInventario)
        // Pero aquí simplificamos: productosFiltradosPorCategoria son los que se muestran en el grid

        // Recalculamos productosFiltradosPorCategoria solo con el filtro de categoría
        let productosCategoria = [...this.productosInventario];
        if (this.categoriaSeleccionada) {
            productosCategoria = productosCategoria.filter(producto =>
                producto.articulo?.categoria_id === this.categoriaSeleccionada
            );
        }
        // Si hay búsqueda, el grid también debería filtrarse por búsqueda? 
        // En el original: 
        // this.productosFiltrados = productos (con todos los filtros)
        // this.productosFiltradosPorCategoria = productos (con todos los filtros)
        // Y el grid usa: (productosFiltradosPorCategoria.length > 0 ? productosFiltradosPorCategoria : productosInventario)

        // Vamos a mantener la lógica original:
        this.productosFiltradosPorCategoria = productos;

        this.mostrarSugerenciasProducto = this.busquedaProducto.length > 0 && this.productosFiltrados.length > 0;
    }

    seleccionarCategoria(categoriaId: number | null): void {
        this.categoriaSeleccionada = categoriaId;
        this.aplicarFiltros();
    }

    seleccionarProductoCatalogo(producto: ProductoInventario): void {
        this.productoSeleccionado = producto;
        this.busquedaProducto = producto.articulo?.nombre || '';
        this.mostrarSugerenciasProducto = false;
    }

    limpiarBusquedaProducto(): void {
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

    agregarProductoAVenta(producto?: ProductoInventario | null): void {
        const productoAAgregar = producto || this.productoSeleccionado;

        if (!productoAAgregar) {
            // Si no hay producto seleccionado, intentar buscar por código exacto si hay algo escrito
            if (this.busquedaProducto) {
                this.agregarRapidoPorCodigo({ key: 'Enter' } as any);
                return;
            }
            alert('Por favor seleccione un producto del catálogo');
            return;
        }

        this.addProduct.emit(productoAAgregar);

        // Limpiar después de agregar
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
                // Si no es un código exacto, quizás el usuario solo quería filtrar y presionó enter
                // En ese caso, si hay un solo resultado filtrado, podríamos agregarlo?
                // Por ahora, solo alertamos si parece un intento de código (ej. solo números o longitud específica)
                // O simplemente no hacemos nada y dejamos que el filtro actúe.

                // Opción: Si hay exactamente 1 producto filtrado, agregarlo.
                if (this.productosFiltrados.length === 1) {
                    this.agregarProductoAVenta(this.productosFiltrados[0]);
                }
            }
        }
    }
}
