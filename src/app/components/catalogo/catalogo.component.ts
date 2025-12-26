import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { ArticuloService } from '../../services/articulo.service';
import { VentaService, ProductoInventario } from '../../services/venta.service';
import { AlmacenService } from '../../services/almacen.service';
import { AuthService } from '../../services/auth.service';
import { Articulo, Almacen } from '../../interfaces';
import { environment } from '../../../environments/environment';

interface ProductoCatalogo {
    id: number;
    nombre: string;
    codigo: string;
    precio_venta: number;
    stock_total: number;
    stock_por_almacen: Array<{ almacen: string; stock: number; almacen_id?: number }>;
    tiene_stock: boolean;
    articulo?: Articulo;
}

@Component({
    selector: 'app-catalogo',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './catalogo.component.html'
})
export class CatalogoComponent implements OnInit {
    productos: ProductoCatalogo[] = [];
    productosFiltrados: ProductoCatalogo[] = [];
    almacenes: Almacen[] = [];
    
    // Filtros
    searchTerm: string = '';
    
    // Estados
    isLoading = false;
    currentPage = 1;
    itemsPerPage = 20;
    
    constructor(
        private articuloService: ArticuloService,
        private ventaService: VentaService,
        private almacenService: AlmacenService,
        private authService: AuthService,
        private http: HttpClient
    ) { }

    ngOnInit(): void {
        this.loadAlmacenes();
    }

    loadAlmacenes(): void {
        this.almacenService.getAll().subscribe({
            next: (response: any) => {
                try {
                    if (Array.isArray(response)) {
                        this.almacenes = response;
                    } else if (response?.data) {
                        if (Array.isArray(response.data)) {
                            this.almacenes = response.data;
                        } else if (response.data?.data && Array.isArray(response.data.data)) {
                            this.almacenes = response.data.data;
                        } else {
                            this.almacenes = [];
                        }
                    } else {
                        this.almacenes = [];
                    }
                    
                    this.loadProductos();
                } catch (e) {
                    console.error('Error procesando respuesta de almacenes:', e);
                    this.almacenes = [];
                }
            },
            error: (error) => {
                console.error('Error cargando almacenes:', error);
                this.almacenes = [];
            }
        });
    }

    loadProductos(): void {
        this.isLoading = true;
        
        // Obtener todos los artículos
        this.articuloService.getAll(1, 10000).subscribe({
            next: (articulosResponse: any) => {
                let articulos: Articulo[] = [];
                
                // Procesar respuesta de artículos
                if (Array.isArray(articulosResponse)) {
                    articulos = articulosResponse;
                } else if (articulosResponse?.data) {
                    if (Array.isArray(articulosResponse.data)) {
                        articulos = articulosResponse.data;
                    } else if (articulosResponse.data?.data && Array.isArray(articulosResponse.data.data)) {
                        articulos = articulosResponse.data.data;
                    }
                }

                // Obtener stock de inventarios para cada almacén (incluyendo sin stock)
                if (this.almacenes.length > 0) {
                    const observables = this.almacenes.map(almacen => {
                        let params = new HttpParams()
                            .set('almacen_id', almacen.id.toString())
                            .set('incluir_sin_stock', 'true');
                        return this.http.get<ProductoInventario[]>(
                            `${environment.apiUrl}/ventas/productos-inventario`,
                            { params }
                        );
                    });

                    // Combinar todos los observables
                    forkJoin(observables).subscribe({
                        next: (inventariosPorAlmacen: ProductoInventario[][]) => {
                            this.procesarProductos(articulos, inventariosPorAlmacen);
                            this.isLoading = false;
                        },
                        error: (error) => {
                            console.error('Error cargando inventarios:', error);
                            // Si falla, mostrar productos sin stock
                            this.procesarProductos(articulos, []);
                            this.isLoading = false;
                        }
                    });
                } else {
                    // Si no hay almacenes, mostrar productos sin stock
                    this.procesarProductos(articulos, []);
                    this.isLoading = false;
                }
            },
            error: (error) => {
                console.error('Error cargando artículos:', error);
                this.isLoading = false;
            }
        });
    }

    procesarProductos(articulos: Articulo[], inventariosPorAlmacen: ProductoInventario[][]): void {
        const productosMap = new Map<number, ProductoCatalogo>();

        // Inicializar productos
        articulos.forEach(articulo => {
            productosMap.set(articulo.id, {
                id: articulo.id,
                nombre: articulo.nombre || 'Sin nombre',
                codigo: articulo.codigo || 'N/A',
                precio_venta: articulo.precio_venta || 0,
                stock_total: 0,
                stock_por_almacen: [],
                tiene_stock: false,
                articulo: articulo
            });
        });

        // Procesar inventarios por almacén
        inventariosPorAlmacen.forEach((inventarios, indexAlmacen) => {
            const almacen = this.almacenes[indexAlmacen];
            if (!almacen) return;

            inventarios.forEach(inv => {
                const producto = productosMap.get(inv.articulo_id);
                if (producto) {
                    const stock = inv.stock_disponible || 0;
                    producto.stock_total += stock;
                    producto.stock_por_almacen.push({
                        almacen: almacen.nombre_almacen || 'N/A',
                        stock: stock,
                        almacen_id: almacen.id
                    });
                    if (stock > 0) {
                        producto.tiene_stock = true;
                    }
                }
            });
        });

        this.productos = Array.from(productosMap.values());
        this.aplicarFiltros();
    }

    aplicarFiltros(): void {
        let filtrados = [...this.productos];

        // Solo filtro de búsqueda
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filtrados = filtrados.filter(p => 
                p.nombre.toLowerCase().includes(term) ||
                p.codigo.toLowerCase().includes(term)
            );
        }

        this.productosFiltrados = filtrados;
        this.currentPage = 1;
    }

    onSearchChange(): void {
        this.aplicarFiltros();
    }

    verDetalles(producto: ProductoCatalogo): void {
        // TODO: Implementar modal o navegación a detalles del producto
        const precio = new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(producto.precio_venta);
        alert(`Detalles de: ${producto.nombre}\nCódigo: ${producto.codigo}\nPrecio: ${precio}\nStock Total: ${producto.stock_total}`);
    }

    agregarAlCarrito(producto: ProductoCatalogo): void {
        // TODO: Implementar lógica para agregar al carrito
        // Por ahora, redirigir a nueva venta con el producto seleccionado
        if (producto.tiene_stock) {
            window.location.href = `/ventas/nueva?articulo_id=${producto.id}`;
        } else {
            alert('Este producto no tiene stock disponible');
        }
    }

    getProductosPaginados(): ProductoCatalogo[] {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        return this.productosFiltrados.slice(start, end);
    }

    getTotalPages(): number {
        return Math.ceil(this.productosFiltrados.length / this.itemsPerPage);
    }

    cambiarPagina(page: number): void {
        this.currentPage = page;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

