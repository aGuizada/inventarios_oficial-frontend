import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { VentaService } from '../../../services/venta.service';
import { Venta, PaginationParams } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

// Import child components
import { VentasHistoryComponent } from './ventas-history/ventas-history.component';
import { VentaFormComponent } from './venta-form/venta-form.component';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, VentasHistoryComponent, VentaFormComponent, SearchBarComponent, PaginationComponent],
  templateUrl: './ventas.component.html',
})
export class VentasComponent implements OnInit {
  ventas: Venta[] = [];
  isLoading = false;
  isHistorialView = false;
  
  // Paginación
  currentPage: number = 1;
  lastPage: number = 1;
  total: number = 0;
  perPage: number = 15;
  searchTerm: string = '';

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
    
    const params: PaginationParams = {
      page: this.currentPage,
      per_page: this.perPage,
      sort_by: 'id',
      sort_order: 'desc'
    };
    
    if (this.searchTerm) {
      params.search = this.searchTerm;
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
    console.log('Ver detalle venta:', venta);
    // Aquí podrías navegar a una vista de detalle o abrir un modal
    // this.router.navigate(['/ventas/detalle', venta.id]);
  }

  onSaleCompleted(): void {
    // Cuando se completa una venta, navegar al historial
    this.router.navigate(['/ventas/historial']);
  }
}
