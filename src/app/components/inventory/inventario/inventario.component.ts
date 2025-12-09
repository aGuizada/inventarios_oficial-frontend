import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventarioService } from '../../../services/inventario.service';
import { AlmacenService } from '../../../services/almacen.service';
import { Inventario, Almacen, ApiResponse, PaginationParams } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

// Import child components
import { InventarioListComponent } from './inventario-list/inventario-list.component';
import { InventarioFiltersComponent } from './inventario-filters/inventario-filters.component';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [
    CommonModule,
    InventarioListComponent,
    InventarioFiltersComponent,
    SearchBarComponent,
    PaginationComponent
  ],
  templateUrl: './inventario.component.html',
})
export class InventarioComponent implements OnInit {
  inventarios: Inventario[] = [];
  inventariosFiltrados: Inventario[] = [];
  almacenes: Almacen[] = [];
  almacenSeleccionado: number | null = null;
  isLoading = false;
  busqueda: string = '';
  
  // Paginación
  currentPage: number = 1;
  lastPage: number = 1;
  total: number = 0;
  perPage: number = 15;
  searchTerm: string = '';

  constructor(
    private inventarioService: InventarioService,
    private almacenService: AlmacenService
  ) {}

  ngOnInit(): void {
    this.loadAlmacenes();
    this.loadInventarios();
  }

  loadAlmacenes(): void {
    this.almacenService.getAll().subscribe({
      next: (response: ApiResponse<Almacen[]> | { data: Almacen[] }) => {
        // El backend devuelve { data: [...] }
        if ('data' in response) {
          this.almacenes = response.data || [];
        } else if (Array.isArray(response)) {
          this.almacenes = response;
        } else {
          this.almacenes = [];
        }
      },
      error: (error) => {
        console.error('Error al cargar almacenes:', error);
        this.almacenes = [];
      }
    });
  }

  loadInventarios(): void {
    this.isLoading = true;
    
    const params: PaginationParams = {
      page: this.currentPage,
      per_page: this.perPage,
      sort_by: 'id',
      sort_order: 'desc'
    };
    
    if (this.searchTerm) {
      params.search = this.searchTerm;
    }
    
    this.inventarioService.getPaginated(params)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.inventarios = response.data.data || [];
            this.currentPage = response.data.current_page;
            this.lastPage = response.data.last_page;
            this.total = response.data.total;
            this.perPage = response.data.per_page;
            this.aplicarFiltros();
          }
        },
        error: (error) => {
          console.error('Error al cargar inventarios:', error);
          // Fallback a getAll si falla la paginación
          this.inventarioService.getAll()
            .pipe(finalize(() => this.isLoading = false))
            .subscribe({
              next: (inventarios) => {
                this.inventarios = inventarios;
                this.aplicarFiltros();
              }
            });
        }
      });
  }

  onSearch(search: string): void {
    this.searchTerm = search;
    this.busqueda = search;
    this.currentPage = 1;
    this.loadInventarios();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadInventarios();
  }

  onAlmacenChange(almacenId: number | null): void {
    this.almacenSeleccionado = almacenId;
    this.aplicarFiltros();
  }

  onBusquedaChange(busqueda: string): void {
    this.busqueda = busqueda;
    this.aplicarFiltros();
  }

  onClearFilters(): void {
    this.limpiarFiltros();
  }

  aplicarFiltros(): void {
    let filtrados = [...this.inventarios];
    console.log('Inventarios totales:', filtrados.length);
    console.log('Almacén seleccionado para filtrar:', this.almacenSeleccionado);

    // Filtrar por almacén
    if (this.almacenSeleccionado !== null && this.almacenSeleccionado !== undefined) {
      const almacenIdNum = Number(this.almacenSeleccionado);
      filtrados = filtrados.filter(inv => {
        const invAlmacenId = Number(inv.almacen_id);
        const coincide = invAlmacenId === almacenIdNum;
        if (!coincide && inv.almacen_id) {
          console.log(`Inventario ${inv.id}: almacen_id=${inv.almacen_id} (${typeof inv.almacen_id}) no coincide con ${almacenIdNum} (${typeof almacenIdNum})`);
        }
        return coincide;
      });
      console.log('Inventarios filtrados por almacén:', filtrados.length);
    }

    // Filtrar por búsqueda (nombre de artículo o código)
    if (this.busqueda.trim()) {
      const busquedaLower = this.busqueda.toLowerCase().trim();
      filtrados = filtrados.filter(inv => {
        const nombre = inv.articulo?.nombre?.toLowerCase() || '';
        const codigo = inv.articulo?.codigo?.toLowerCase() || '';
        return nombre.includes(busquedaLower) || codigo.includes(busquedaLower);
      });
    }

    this.inventariosFiltrados = filtrados;
  }

  limpiarFiltros(): void {
    this.almacenSeleccionado = null;
    this.busqueda = '';
    this.aplicarFiltros();
  }

  getTotalCantidad(): number {
    return this.inventariosFiltrados.reduce((sum, inv) => sum + inv.cantidad, 0);
  }

  getTotalSaldoStock(): number {
    return this.inventariosFiltrados.reduce((sum, inv) => sum + inv.saldo_stock, 0);
  }
}
