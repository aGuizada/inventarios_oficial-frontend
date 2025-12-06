import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreditoVentaService } from '../../../services/credito-venta.service';
import { CuotaCreditoService } from '../../../services/cuota-credito.service';
import { VentaService } from '../../../services/venta.service';
import { CreditoVenta, CuotaCredito } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

// Import child components
import { CreditosListComponent } from './creditos-list/creditos-list.component';
import { CreditoDetailComponent } from './credito-detail/credito-detail.component';
import { CreditoPagoComponent } from './credito-pago/credito-pago.component';

@Component({
  selector: 'app-creditos',
  standalone: true,
  imports: [
    CommonModule,
    CreditosListComponent,
    CreditoDetailComponent,
    CreditoPagoComponent
  ],
  templateUrl: './creditos.component.html',
})
export class CreditosComponent implements OnInit {
  creditos: CreditoVenta[] = [];
  isLoading = false;
  creditoSeleccionado: CreditoVenta | null = null;
  cuotas: CuotaCredito[] = [];
  isDetailModalOpen = false;
  isPagoModalOpen = false;
  isPaying = false;
  currentUserId = 1; // TODO: Obtener del servicio de autenticación

  constructor(
    private creditoVentaService: CreditoVentaService,
    private cuotaCreditoService: CuotaCreditoService,
    private ventaService: VentaService
  ) { }

  ngOnInit(): void {
    this.loadCreditos();
  }

  loadCreditos(): void {
    this.isLoading = true;
    this.creditoVentaService.getAll()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response: any) => {
          console.log('Respuesta de créditos:', response);
          // La API puede devolver un array directo o envuelto en data
          let datos: any[] = [];
          if (Array.isArray(response)) {
            datos = response;
          } else if (response && response.data) {
            datos = Array.isArray(response.data) ? response.data : [];
          } else if (response && response.success && response.data) {
            datos = Array.isArray(response.data) ? response.data : [];
          }
          this.creditos = datos;
          console.log('Créditos cargados:', this.creditos);
        },
        error: (error) => {
          console.error('Error al cargar créditos:', error);
          console.error('Detalles del error:', error.error);
          this.creditos = [];
        }
      });
  }

  onViewDetail(credito: CreditoVenta): void {
    if (credito.venta && credito.venta.detalles) {
      this.creditoSeleccionado = credito;
      this.isDetailModalOpen = true;
      return;
    }

    this.creditoVentaService.getById(credito.id).subscribe({
      next: (response: any) => {
        const creditoCompleto = response.data || response;
        this.creditoSeleccionado = creditoCompleto;
        this.isDetailModalOpen = true;
      },
      error: (error) => {
        console.error('Error al cargar detalle del crédito:', error);
        this.creditoSeleccionado = credito;
        if (credito.venta_id) {
          this.cargarVentaConDetalles(credito.venta_id);
        }
        this.isDetailModalOpen = true;
      }
    });
  }

  cargarVentaConDetalles(ventaId: number): void {
    this.ventaService.getById(ventaId).subscribe({
      next: (venta: any) => {
        console.log('✅ Venta cargada directamente:', venta);
        if (this.creditoSeleccionado) {
          this.creditoSeleccionado.venta = venta;
          console.log('📦 Venta asignada al crédito:', this.creditoSeleccionado.venta);
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar la venta:', error);
      }
    });
  }

  loadCuotas(creditoId: number): void {
    this.cuotaCreditoService.getByCreditoId(creditoId).subscribe({
      next: (response: any) => {
        console.log('📥 Respuesta de cuotas:', response);
        let datos: any[] = [];
        if (Array.isArray(response)) {
          datos = response;
        } else if (response && response.data) {
          datos = Array.isArray(response.data) ? response.data : [];
        } else if (response && response.success && response.data) {
          datos = Array.isArray(response.data) ? response.data : [];
        }
        this.cuotas = datos;
        console.log('✅ Cuotas cargadas:', this.cuotas);
        console.log('🔢 Cantidad de cuotas:', this.cuotas.length);
        
        // Si no hay cuotas, generar las cuotas automáticamente
        if (this.cuotas.length === 0 && this.creditoSeleccionado) {
          console.log('⚠️ No hay cuotas, se deben generar automáticamente');
          this.generarCuotas(creditoId);
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar cuotas:', error);
        this.cuotas = [];
      }
    });
  }

  generarCuotas(creditoId: number): void {
    // Las cuotas se generan automáticamente en el backend cuando se crea el crédito
    // Si no existen, recargar después de un momento
    console.log('🔄 Recargando cuotas...');
    setTimeout(() => {
      this.loadCuotas(creditoId);
    }, 500);
  }

  closeDetailModal(): void {
    this.isDetailModalOpen = false;
    this.creditoSeleccionado = null;
  }

  onPay(credito: CreditoVenta): void {
    this.creditoSeleccionado = credito;
    this.isPagoModalOpen = true;
    this.loadCuotas(credito.id);
  }

  closePagoModal(): void {
    this.isPagoModalOpen = false;
    this.creditoSeleccionado = null;
    this.cuotas = [];
  }

  onPayCuota(event: { cuota: CuotaCredito; monto: number }): void {
    this.isPaying = true;
    this.cuotaCreditoService.pagarCuota(event.cuota.id, event.monto, this.currentUserId)
      .pipe(finalize(() => this.isPaying = false))
      .subscribe({
        next: (response: any) => {
          alert('Cuota pagada exitosamente');
          if (this.creditoSeleccionado) {
            this.loadCuotas(this.creditoSeleccionado.id);
            this.loadCreditos();
            setTimeout(() => {
              const cuotasPendientes = this.cuotas.filter(c => c.estado !== 'Pagado');
              if (cuotasPendientes.length === 0) {
                this.closePagoModal();
              }
            }, 500);
          }
        },
        error: (error) => {
          console.error('Error al pagar cuota:', error);
          const errorMessage = error.error?.message || 'Error al pagar la cuota';
          alert(`Error: ${errorMessage}`);
        }
      });
  }

  onGenerateCuotas(creditoId: number): void {
    setTimeout(() => {
      this.loadCuotas(creditoId);
    }, 500);
  }

}
