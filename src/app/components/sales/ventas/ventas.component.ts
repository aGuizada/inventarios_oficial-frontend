import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { VentaService } from '../../../services/venta.service';
import { Venta, PaginationParams } from '../../../interfaces';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';

// Import child components
// Import child components
import { VentasHistoryComponent } from './ventas-history/ventas-history.component';
import { VentaFormComponent } from './venta-form/venta-form.component';
import { VentaDetailModalComponent } from './venta-detail-modal/venta-detail-modal.component';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

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

  constructor(
    private ventaService: VentaService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.route.url.subscribe(url => {
      const path = url[0]?.path;
      this.isHistorialView = path === 'historial';

      if (this.isHistorialView) {
        this.loadVentas();
      }
    });
  }

  loadVentas(): void {
    this.isLoading = true;

    const params: PaginationParams & { estado?: string; has_devoluciones?: string } = {
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

    this.ventaService.getPaginated(params)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.ventas = response.data.data || [];
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
                this.ventas = Array.isArray(ventas) ? ventas : [];
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
    // Cuando se completa una venta, navegar al historial
    this.router.navigate(['/ventas/historial']);
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
    }).then((result) => {
      if (result.isConfirmed) {
        this.ventaService.imprimirComprobante(venta.id!, 'carta');
      } else if (result.isDenied) {
        this.ventaService.imprimirComprobante(venta.id!, 'rollo');
      }
    });
  }
}
