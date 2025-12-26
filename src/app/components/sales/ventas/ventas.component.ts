import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { VentaService } from '../../../services/venta.service';
import { CajaService } from '../../../services/caja.service';
import { Venta, PaginationParams, Caja } from '../../../interfaces';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';

// Import child components
// Import child components
import { VentasHistoryComponent } from './ventas-history/ventas-history.component';
import { VentaFormComponent } from './venta-form/venta-form.component';
import { VentaDetailModalComponent } from './venta-detail-modal/venta-detail-modal.component';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { AuthService } from '../../../services/auth.service';
import { SucursalService } from '../../../services/sucursal.service';
import { Sucursal } from '../../../interfaces';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule, VentasHistoryComponent, VentaFormComponent, VentaDetailModalComponent, SearchBarComponent, PaginationComponent],
  templateUrl: './ventas.component.html',
})
export class VentasComponent implements OnInit {
  ventas: Venta[] = [];
  isLoading = false;
  isHistorialView = false;

  selectedVenta: Venta | null = null;
  isDetailModalOpen = false;

  // Paginación
  currentPage: number = 1;
  lastPage: number = 1;
  total: number = 0;
  perPage: number = 15;
  searchTerm: string = '';

  filterEstado: string = '';
  filterDevoluciones: boolean = false;
  filterSucursalId: string = '';

  sucursales: Sucursal[] = [];
  isAdmin: boolean = false;
  cajasUsuario: Caja[] = [];
  cajasIdsUsuario: number[] = [];

  constructor(
    private ventaService: VentaService,
    private cajaService: CajaService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private sucursalService: SucursalService
  ) { }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.isAdmin = user?.rol_id === 1;

    if (this.isAdmin) {
      this.loadSucursales();
    }

    this.route.url.subscribe(url => {
      const path = url[0]?.path;
      this.isHistorialView = path === 'historial';

      if (this.isHistorialView) {
        // Si es vendedor, cargar cajas primero y luego ventas
        if (this.authService.isVendedor() && user) {
          this.loadCajasUsuario(() => {
            this.loadVentas();
          });
        } else {
          this.loadVentas();
        }
      }
    });
  }

  loadCajasUsuario(callback?: () => void): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      if (callback) callback();
      return;
    }

    const params: PaginationParams = {
      page: 1,
      per_page: 100,
      user_id: user.id
    };

    this.cajaService.getPaginated(params).subscribe({
      next: (response) => {
        if (response.data) {
          this.cajasUsuario = response.data.data || [];
          // Obtener solo los IDs de las cajas del usuario de su sucursal
          if (user.sucursal_id) {
            this.cajasIdsUsuario = this.cajasUsuario
              .filter(caja => caja.sucursal_id === user.sucursal_id)
              .map(caja => caja.id);
          } else {
            this.cajasIdsUsuario = this.cajasUsuario.map(caja => caja.id);
          }
        }
        if (callback) callback();
      },
      error: (error) => {
        console.error('Error al cargar cajas del usuario:', error);
        // Fallback a getAll
        this.cajaService.getAll().subscribe({
          next: (response: any) => {
            const cajas = Array.isArray(response) ? response : (response.data || []);
            this.cajasUsuario = cajas.filter((caja: Caja) => caja.user_id === user.id);
            if (user.sucursal_id) {
              this.cajasIdsUsuario = this.cajasUsuario
                .filter(caja => caja.sucursal_id === user.sucursal_id)
                .map(caja => caja.id);
            } else {
              this.cajasIdsUsuario = this.cajasUsuario.map(caja => caja.id);
            }
            if (callback) callback();
          },
          error: () => {
            // Si falla todo, continuar sin filtrar por cajas
            this.cajasIdsUsuario = [];
            if (callback) callback();
          }
        });
      }
    });
  }

  loadSucursales(): void {
    this.sucursalService.getAll().subscribe({
      next: (response: any) => {
        this.sucursales = Array.isArray(response) ? response : (response.data || []);
      },
      error: (error) => console.error('Error al cargar sucursales:', error)
    });
  }

  loadVentas(): void {
    this.isLoading = true;

    const user = this.authService.getCurrentUser();
    const isVendedor = this.authService.isVendedor();

    const params: PaginationParams & { estado?: string; has_devoluciones?: string; sucursal_id?: string; user_id?: number } = {
      page: this.currentPage,
      per_page: this.perPage,
      sort_by: 'id',
      sort_order: 'desc'
    };

    if (this.searchTerm) {
      params.search = this.searchTerm;
    }

    if (this.filterEstado) {
      params.estado = this.filterEstado;
    }

    if (this.filterDevoluciones) {
      params.has_devoluciones = 'true';
    }

    // Si es vendedor, filtrar por su usuario y sucursal
    if (isVendedor && user) {
      params.user_id = user.id;
      // Si el usuario tiene sucursal_id, filtrar por esa sucursal
      if (user.sucursal_id) {
        params.sucursal_id = user.sucursal_id.toString();
      }
    } else if (this.filterSucursalId) {
      // Solo aplicar filtro de sucursal si es admin y se seleccionó una sucursal
      params.sucursal_id = this.filterSucursalId;
    }

    this.ventaService.getPaginated(params)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          if (response.data) {
            let ventasData = response.data.data || [];
            
            // Filtro adicional en frontend para asegurar que solo vea sus ventas de su sucursal
            if (isVendedor && user) {
              console.log('Filtrando ventas para vendedor:', {
                userId: user.id,
                sucursalId: user.sucursal_id,
                cajasIdsUsuario: this.cajasIdsUsuario,
                totalVentasAntes: ventasData.length,
                ventasEjemplo: ventasData.slice(0, 3).map(v => ({ id: v.id, user_id: v.user_id, caja_id: v.caja_id }))
              });
              
              ventasData = ventasData.filter((venta: Venta) => {
                // Primero verificar que sea del usuario
                if (venta.user_id !== user.id) {
                  console.log('Venta filtrada - no es del usuario:', venta.id, 'user_id:', venta.user_id, 'esperado:', user.id);
                  return false;
                }
                
                // Si tenemos las cajas cargadas, filtrar por cajas de su sucursal
                if (this.cajasIdsUsuario.length > 0) {
                  const perteneceACajaUsuario = this.cajasIdsUsuario.includes(venta.caja_id);
                  if (!perteneceACajaUsuario) {
                    console.log('Venta filtrada - no pertenece a caja del usuario:', venta.id, 'caja_id:', venta.caja_id, 'cajasIdsUsuario:', this.cajasIdsUsuario);
                  }
                  return perteneceACajaUsuario;
                }
                
                // Si no tenemos las cajas aún, mostrar todas las ventas del usuario
                // (se recargará cuando se carguen las cajas)
                console.warn('Cajas no cargadas aún, mostrando todas las ventas del usuario');
                return true;
              });
              
              console.log('Total ventas después del filtro:', ventasData.length);
            }
            
            this.ventas = ventasData;
            this.currentPage = response.data.current_page;
            this.lastPage = response.data.last_page;
            this.total = response.data.total;
            this.perPage = response.data.per_page;
          }
        },
        error: (error) => {
          console.error('Error al cargar ventas:', error);
          // Fallback a getAll si falla la paginación
          this.ventaService.getAll()
            .pipe(finalize(() => this.isLoading = false))
            .subscribe({
              next: (ventas) => {
                let ventasData = Array.isArray(ventas) ? ventas : [];
                
                // Filtro adicional en frontend para vendedores
                if (isVendedor && user) {
                  ventasData = ventasData.filter((venta: Venta) => {
                    // Filtrar por usuario
                    if (venta.user_id !== user.id) return false;
                    
                    // Si tenemos las cajas cargadas, filtrar por cajas de su sucursal
                    if (this.cajasIdsUsuario.length > 0) {
                      return this.cajasIdsUsuario.includes(venta.caja_id);
                    }
                    
                    // Si no tenemos las cajas aún, solo filtrar por usuario
                    return true;
                  });
                }
                
                this.ventas = ventasData;
              }
            });
        }
      });
  }

  onSearch(search: string): void {
    this.searchTerm = search;
    this.currentPage = 1;
    this.loadVentas();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadVentas();
  }

  navegarANuevaVenta(): void {
    this.router.navigate(['/ventas/nueva']);
  }

  verDetalleVenta(venta: Venta): void {
    // Show loading state if needed, or just fetch
    // Using a separate loading flag would be better, but for now let's just fetch
    // We could add isDetailLoading property

    // Optimistic open or wait? Let's wait for data to ensure we have details
    // But we need to show feedback. 
    // Let's use Swal for loading or just a simple flag if we had one.
    // Since we don't want to hide the table, let's just use Swal to show loading

    Swal.fire({
      title: 'Cargando detalles...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.ventaService.getById(venta.id!)
      .pipe(finalize(() => Swal.close()))
      .subscribe({
        next: (fullVenta) => {
          this.selectedVenta = fullVenta;
          this.isDetailModalOpen = true;
        },
        error: (error) => {
          console.error('Error al cargar detalles de venta:', error);
          Swal.fire('Error', 'No se pudieron cargar los detalles de la venta', 'error');
        }
      });
  }

  closeDetailModal(): void {
    this.selectedVenta = null;
    this.isDetailModalOpen = false;
  }

  onSaleCompleted(): void {
    // Cuando se completa una venta, recargar cajas y navegar al historial
    const user = this.authService.getCurrentUser();
    if (this.authService.isVendedor() && user) {
      this.loadCajasUsuario(() => {
        this.router.navigate(['/ventas/historial']);
      });
    } else {
      this.router.navigate(['/ventas/historial']);
    }
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadVentas();
  }

  onDevolverVenta(venta: Venta): void {
    this.router.navigate(['/operaciones/devoluciones/nuevo'], { queryParams: { venta_id: venta.id } });
  }

  onAnularVenta(venta: Venta): void {
    if (confirm('¿Está seguro de que desea anular esta venta? Esta acción no se puede deshacer.')) {
      this.isLoading = true;
      this.ventaService.anular(venta.id!)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: () => {
            alert('Venta anulada exitosamente');
            this.loadVentas();
          },
          error: (error) => {
            console.error('Error al anular venta:', error);
            alert('Error al anular la venta');
          }
        });
    }
  }

  onImprimirComprobante(venta: Venta): void {
    Swal.fire({
      title: 'Imprimir Comprobante',
      text: 'Seleccione el formato de impresión',
      icon: 'question',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Imprimir Carta',
      denyButtonText: 'Imprimir Rollo',
      cancelButtonText: 'Cancelar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.ventaService.imprimirComprobante(venta.id!, 'carta');
      } else if (result.isDenied) {
        this.ventaService.imprimirComprobante(venta.id!, 'rollo');
      }
    });
  }

  exportarReporteDetallado(): void {
    // Obtener fechas de los filtros actuales o usar todas las ventas
    const params: any = {};
    
    // Si hay filtros de fecha en el futuro, se pueden agregar aquí
    // Por ahora, exporta todas las ventas visibles
    
    if (this.filterSucursalId) {
      params.sucursal_id = parseInt(this.filterSucursalId);
    }

    this.ventaService.exportReporteDetalladoPDF(params);
  }

  exportarReporteGeneral(): void {
    const params: any = {};
    
    if (this.filterSucursalId) {
      params.sucursal_id = parseInt(this.filterSucursalId);
    }

    this.ventaService.exportReporteGeneralPDF(params);
  }
}
