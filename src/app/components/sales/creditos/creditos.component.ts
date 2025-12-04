import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreditoVentaService } from '../../../services/credito-venta.service';
import { CuotaCreditoService } from '../../../services/cuota-credito.service';
import { VentaService } from '../../../services/venta.service';
import { CreditoVenta, CuotaCredito } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-creditos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './creditos.component.html',
  styleUrl: './creditos.component.css'
})
export class CreditosComponent implements OnInit {
  creditos: CreditoVenta[] = [];
  isLoading = false;
  creditoSeleccionado: CreditoVenta | null = null;
  cuotas: CuotaCredito[] = [];
  isModalOpen = false;
  isModalPagoCuotasOpen = false;
  isPaying = false;
  cuotaAPagar: CuotaCredito | null = null;
  montoPago: number = 0;
  currentUserId = 1; // TODO: Obtener del servicio de autenticación

  constructor(
    private creditoVentaService: CreditoVentaService,
    private cuotaCreditoService: CuotaCreditoService,
    private ventaService: VentaService
  ) {}

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

  verDetalleCredito(credito: CreditoVenta): void {
    // Si el crédito ya tiene la venta cargada, usarlo directamente
    if (credito.venta && credito.venta.detalles) {
      this.creditoSeleccionado = credito;
      this.isModalOpen = true;
      return;
    }

    // Intentar cargar el crédito completo con detalles de la venta
    this.creditoVentaService.getById(credito.id).subscribe({
      next: (response: any) => {
        console.log('📥 Respuesta completa del backend:', response);
        const creditoCompleto = response.data || response;
        this.creditoSeleccionado = creditoCompleto;
        console.log('✅ Crédito completo cargado:', creditoCompleto);
        console.log('📦 Venta:', creditoCompleto.venta);
        console.log('📋 Detalles de venta:', creditoCompleto.venta?.detalles);
        console.log('🔢 Cantidad de detalles:', creditoCompleto.venta?.detalles?.length);
        this.isModalOpen = true;
      },
      error: (error) => {
        console.error('❌ Error al cargar detalle del crédito:', error);
        console.error('Error completo:', error.error);
        // Si falla, usar el crédito que ya tenemos y cargar la venta directamente
        this.creditoSeleccionado = credito;
        // Si tenemos venta_id, intentar cargar la venta directamente
        if (credito.venta_id) {
          this.cargarVentaConDetalles(credito.venta_id);
        }
        this.isModalOpen = true;
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

  cerrarModal(): void {
    this.isModalOpen = false;
    this.creditoSeleccionado = null;
    this.cuotas = [];
    this.cuotaAPagar = null;
    this.montoPago = 0;
  }

  cerrarModalPagoCuotas(): void {
    this.isModalPagoCuotasOpen = false;
    this.creditoSeleccionado = null;
    this.cuotas = [];
  }

  abrirModalPago(credito: CreditoVenta): void {
    // Cargar las cuotas del crédito primero
    this.creditoSeleccionado = credito;
    this.isModalPagoCuotasOpen = true; // Abrir modal inmediatamente
    this.loadCuotas(credito.id);
  }

  abrirPagarCuota(cuota: CuotaCredito): void {
    this.cuotaAPagar = cuota;
    this.montoPago = cuota.precio_cuota || cuota.saldo_restante || 0;
  }

  cerrarPagarCuota(): void {
    this.cuotaAPagar = null;
    this.montoPago = 0;
  }

  pagarCuota(): void {
    if (!this.cuotaAPagar || this.montoPago <= 0) {
      alert('Por favor ingrese un monto válido');
      return;
    }

    this.isPaying = true;
    this.cuotaCreditoService.pagarCuota(this.cuotaAPagar.id, this.montoPago, this.currentUserId)
      .pipe(finalize(() => this.isPaying = false))
      .subscribe({
        next: (response: any) => {
          console.log('Cuota pagada:', response);
          alert('Cuota pagada exitosamente');
          this.cerrarPagarCuota();
          if (this.creditoSeleccionado) {
            this.loadCuotas(this.creditoSeleccionado.id);
            this.loadCreditos(); // Recargar créditos para actualizar estado
            // Verificar si quedan cuotas pendientes
            setTimeout(() => {
              const cuotasPendientes = this.cuotas.filter(c => c.estado !== 'Pagado');
              if (cuotasPendientes.length === 0) {
                this.cerrarModalPagoCuotas();
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

  getCuotasPendientes(credito: CreditoVenta): number {
    if (!credito.cuotas || credito.cuotas.length === 0) {
      return credito.numero_cuotas || 0;
    }
    return credito.cuotas.filter(c => c.estado !== 'Pagado').length;
  }

  getCuotasPagadas(credito: CreditoVenta): number {
    if (!credito.cuotas || credito.cuotas.length === 0) {
      return 0;
    }
    return credito.cuotas.filter(c => c.estado === 'Pagado').length;
  }
}
