import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { VentaService } from '../../../services/venta.service';
import { Venta } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

// Import child components
import { VentasHistoryComponent } from './ventas-history/ventas-history.component';
import { VentaFormComponent } from './venta-form/venta-form.component';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, VentasHistoryComponent, VentaFormComponent],
  templateUrl: './ventas.component.html',
})
export class VentasComponent implements OnInit {
  ventas: Venta[] = [];
  isLoading = false;
  isHistorialView = false;

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
    this.ventaService.getAll()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (ventas) => {
          this.ventas = ventas;
        },
        error: (error) => {
          console.error('Error al cargar ventas:', error);
        }
      });
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
