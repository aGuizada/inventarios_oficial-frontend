import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { InventarioService } from '../../../services/inventario.service';
import { AlmacenService } from '../../../services/almacen.service';
import { AuthService } from '../../../services/auth.service';
import { SucursalService } from '../../../services/sucursal.service';
import { Inventario, Almacen, ApiResponse, PaginationParams, Sucursal } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

// Import child components
import { InventarioListComponent } from './inventario-list/inventario-list.component';
import { InventarioFiltersComponent } from './inventario-filters/inventario-filters.component';
import { InventarioImportarComponent } from './inventario-importar.component';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [
    CommonModule,
    InventarioListComponent,
    InventarioFiltersComponent,
    InventarioImportarComponent,
    SearchBarComponent,
    PaginationComponent
  ],
  templateUrl: './inventario.component.html',
})
export class InventarioComponent implements OnInit {
  inventarios: Inventario[] = [];
  inventariosFiltrados: Inventario[] = [];
  inventariosPorItem: any[] = [];
  almacenes: Almacen[] = [];
  sucursales: Sucursal[] = [];
  almacenSeleccionado: number | null = null;
  sucursalSeleccionada: number | null = null;
  isAdmin: boolean = false;
  isLoading = false;
  busqueda: string = '';
  vista: 'item' | 'lotes' = 'lotes'; // Vista por defecto
  currentUserSucursalId: number | null = null;

  onImportSuccess(): void {
    this.loadInventarios();
    this.loadInventariosPorItem();
  }

  // Paginación
  currentPage: number = 1;
  lastPage: number = 1;
  total: number = 0;
  perPage: number = 15;
  searchTerm: string = '';

  constructor(
    private inventarioService: InventarioService,
    private almacenService: AlmacenService,
    private router: Router,
    private authService: AuthService,
    private sucursalService: SucursalService
  ) { }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.isAdmin = user?.rol_id === 1;
    this.currentUserSucursalId = user?.sucursal_id || null;

    if (this.isAdmin) {
      this.loadSucursales();
    } else {
      // Si es vendedor, establecer automáticamente su sucursal
      if (this.currentUserSucursalId) {
        this.sucursalSeleccionada = this.currentUserSucursalId;
      }
    }

    this.loadAlmacenes();
    this.loadInventarios();
    this.loadInventariosPorItem();
  }

  loadSucursales(): void {
    this.sucursalService.getAll().subscribe({
      next: (response: any) => {
        this.sucursales = Array.isArray(response) ? response : (response.data || []);
      },
      error: (error) => console.error('Error al cargar sucursales:', error)
    });
  }

  loadAlmacenes(): void {
    this.almacenService.getAll().subscribe({
      next: (response: ApiResponse<Almacen[]> | { data: Almacen[] }) => {
        // El backend devuelve { data: [...] }
        let almacenesData: Almacen[] = [];
        if ('data' in response) {
          almacenesData = response.data || [];
        } else if (Array.isArray(response)) {
          almacenesData = response;
        }
        
        // Si es vendedor, filtrar solo almacenes de su sucursal
        if (!this.isAdmin && this.currentUserSucursalId) {
          this.almacenes = almacenesData.filter(almacen => 
            almacen.sucursal_id === this.currentUserSucursalId
          );
        } else {
          this.almacenes = almacenesData;
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

    const params: any = {
      page: this.currentPage,
      per_page: this.perPage,
      sort_by: 'id',
      sort_order: 'desc'
    };

    if (this.searchTerm) {
      params.search = this.searchTerm;
    }

    // Si es vendedor, siempre filtrar por su sucursal
    if (!this.isAdmin && this.currentUserSucursalId) {
      params.sucursal_id = this.currentUserSucursalId;
    } else if (this.sucursalSeleccionada !== null && this.sucursalSeleccionada !== undefined) {
      // Solo aplicar filtro de sucursal si es admin y se seleccionó una
      params.sucursal_id = this.sucursalSeleccionada;
    }

    // Agregar filtro por almacén si está seleccionado
    if (this.almacenSeleccionado !== null && this.almacenSeleccionado !== undefined) {
      params.almacen_id = this.almacenSeleccionado;
    }

    // Usar getPorLotes para mostrar todas las compras que van al inventario
    this.inventarioService.getPorLotes(params)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            let inventariosData = response.data.data || [];
            
            // Filtro adicional en frontend para vendedores (asegurar independencia)
            if (!this.isAdmin && this.currentUserSucursalId) {
              inventariosData = inventariosData.filter((inv: Inventario) => {
                const almacen = this.almacenes.find(a => a.id === inv.almacen_id);
                return almacen && almacen.sucursal_id === this.currentUserSucursalId;
              });
            }
            
            this.inventarios = inventariosData;
            this.currentPage = response.data.current_page;
            this.lastPage = response.data.last_page;
            this.total = response.data.total;
            this.perPage = response.data.per_page;
            this.aplicarFiltros();
          } else if (response.data) {
            // Si viene directamente como array
            let inventariosData = Array.isArray(response.data) ? response.data : [];
            
            // Filtro adicional en frontend para vendedores (asegurar independencia)
            if (!this.isAdmin && this.currentUserSucursalId) {
              inventariosData = inventariosData.filter((inv: Inventario) => {
                const almacen = this.almacenes.find(a => a.id === inv.almacen_id);
                return almacen && almacen.sucursal_id === this.currentUserSucursalId;
              });
            }
            
            this.inventarios = inventariosData;
            this.aplicarFiltros();
          }
        },
        error: (error) => {
          console.error('Error al cargar inventarios:', error);
          // Fallback a getPaginated si falla porLotes
          this.inventarioService.getPaginated(params)
            .pipe(finalize(() => this.isLoading = false))
            .subscribe({
              next: (response) => {
                if (response.data) {
                  let inventariosData = response.data.data || [];
                  
                  // Filtro adicional en frontend para vendedores (asegurar independencia)
                  if (!this.isAdmin && this.currentUserSucursalId) {
                    inventariosData = inventariosData.filter((inv: Inventario) => {
                      const almacen = this.almacenes.find(a => a.id === inv.almacen_id);
                      return almacen && almacen.sucursal_id === this.currentUserSucursalId;
                    });
                  }
                  
                  this.inventarios = inventariosData;
                  this.currentPage = response.data.current_page;
                  this.lastPage = response.data.last_page;
                  this.total = response.data.total;
                  this.perPage = response.data.per_page;
                  this.aplicarFiltros();
                }
              },
              error: (err) => {
                console.error('Error al cargar inventarios (fallback):', err);
                this.inventarios = [];
                this.inventariosFiltrados = [];
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
    // Si es vendedor, validar que el almacén pertenezca a su sucursal
    if (!this.isAdmin && this.currentUserSucursalId && almacenId !== null) {
      const almacen = this.almacenes.find(a => a.id === almacenId);
      if (!almacen || almacen.sucursal_id !== this.currentUserSucursalId) {
        console.warn('El vendedor intentó seleccionar un almacén de otra sucursal');
        return;
      }
    }
    
    this.almacenSeleccionado = almacenId;
    this.currentPage = 1; // Resetear a la primera página cuando cambia el filtro
    this.loadInventarios(); // Recargar desde el servidor con el nuevo filtro
  }

  onSucursalChange(): void {
    // Si es vendedor, no permitir cambiar la sucursal
    if (!this.isAdmin && this.currentUserSucursalId) {
      this.sucursalSeleccionada = this.currentUserSucursalId;
    }
    this.currentPage = 1;
    this.loadInventarios();
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

    // Si es vendedor, filtrar SOLO por sucursal del usuario (independiente)
    if (!this.isAdmin && this.currentUserSucursalId) {
      filtrados = filtrados.filter(inv => {
        // Buscar el almacén del inventario
        const almacen = this.almacenes.find(a => a.id === inv.almacen_id);
        // Solo incluir si el almacén pertenece a la sucursal del usuario
        return almacen && almacen.sucursal_id === this.currentUserSucursalId;
      });
      console.log('Inventarios filtrados por sucursal (vendedor):', filtrados.length);
    }

    // Filtrar por almacén (solo si está seleccionado)
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
    // Si es vendedor, mantener su sucursal seleccionada
    if (this.isAdmin) {
      this.sucursalSeleccionada = null;
    } else {
      this.sucursalSeleccionada = this.currentUserSucursalId;
    }
    this.busqueda = '';
    this.aplicarFiltros();
    this.loadInventarios(); // Recargar para limpiar filtros de servidor también
  }

  getTotalCantidad(): number {
    return this.inventariosFiltrados.reduce((sum, inv) => sum + inv.cantidad, 0);
  }

  getTotalSaldoStock(): number {
    return this.inventariosFiltrados.reduce((sum, inv) => sum + inv.saldo_stock, 0);
  }

  loadInventariosPorItem(): void {
    const params: any = {};
    
    // Si es vendedor, filtrar por su sucursal
    if (!this.isAdmin && this.currentUserSucursalId) {
      params.sucursal_id = this.currentUserSucursalId;
    } else if (this.sucursalSeleccionada !== null && this.sucursalSeleccionada !== undefined) {
      // Solo aplicar filtro de sucursal si es admin y se seleccionó una
      params.sucursal_id = this.sucursalSeleccionada;
    }
    
    this.inventarioService.getPorItem(params).subscribe({
      next: (response) => {
        let inventariosPorItemData = response.data || [];
        
        // Filtro adicional en frontend para vendedores (asegurar independencia total)
        if (!this.isAdmin && this.currentUserSucursalId) {
          inventariosPorItemData = inventariosPorItemData.filter((item: any) => {
            // Filtrar por almacenes de la sucursal del usuario
            if (item.almacenes && Array.isArray(item.almacenes)) {
              // Solo mostrar ítems que tengan almacenes de la sucursal del usuario
              const almacenesValidos = item.almacenes.filter((alm: any) => {
                const almacen = this.almacenes.find(a => a.nombre_almacen === alm.almacen);
                return almacen && almacen.sucursal_id === this.currentUserSucursalId;
              });
              
              // Si hay almacenes válidos, actualizar la lista de almacenes del ítem
              if (almacenesValidos.length > 0) {
                item.almacenes = almacenesValidos;
                // Recalcular totales solo con almacenes de la sucursal
                item.total_stock = almacenesValidos.reduce((sum: number, alm: any) => sum + (alm.cantidad || 0), 0);
                item.total_saldo = almacenesValidos.reduce((sum: number, alm: any) => sum + (alm.saldo || alm.cantidad || 0), 0);
                return true;
              }
              return false;
            }
            return false;
          });
        }
        
        this.inventariosPorItem = inventariosPorItemData;
      },
      error: (error) => {
        console.error('Error al cargar inventarios por ítem:', error);
        this.inventariosPorItem = [];
      }
    });
  }

  navegarAAjustes(): void {
    this.router.navigate(['/operaciones/ajustes']);
  }

  exportExcel(): void {
    this.inventarioService.exportExcel();
  }

  exportPDF(): void {
    this.inventarioService.exportPDF();
  }
}
