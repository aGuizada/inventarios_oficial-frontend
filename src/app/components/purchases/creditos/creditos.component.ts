import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { CompraService } from '../../../services/compra.service';
import { CompraCuotaService } from '../../../services/compra-cuota.service';
import { Compra, CompraCuota, PaginationParams } from '../../../interfaces';
import { finalize } from 'rxjs/operators';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { CreditosListComponent } from './creditos-list/creditos-list.component';
import { CompraCreditoPagoComponent } from './compra-credito-pago/compra-credito-pago.component';

@Component({
  selector: 'app-creditos-compras',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    CurrencyPipe,
    SearchBarComponent,
    PaginationComponent,
    CreditosListComponent,
    CompraCreditoPagoComponent
  ],
  templateUrl: './creditos.component.html',
})
export class CreditosComponent implements OnInit {
  compras: Compra[] = [];
  isLoading = false;
  
  // Paginación
  currentPage: number = 1;
  lastPage: number = 1;
  total: number = 0;
  perPage: number = 15;
  searchTerm: string = '';

  // Modales
  isDetailModalOpen = false;
  isPagoModalOpen = false;
  compraSeleccionada: Compra | null = null;
  cuotas: CompraCuota[] = [];
  isPaying = false;

  constructor(
    private compraService: CompraService,
    private compraCuotaService: CompraCuotaService
  ) { }

  ngOnInit(): void {
    this.loadComprasCredito();
  }

  loadComprasCredito(): void {
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
    
    this.compraService.getPaginated(params)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // Filtrar solo compras a crédito
            let todasCompras = response.data.data || [];
            this.compras = todasCompras.filter((compra: Compra) => {
              const tipoCompra = compra.tipo_compra?.toLowerCase();
              return tipoCompra === 'credito' || tipoCompra === 'crédito';
            });
            
            // Cargar cuotas para cada compra a crédito
            // Siempre cargar las cuotas manualmente para asegurar que estén actualizadas
            this.compras.forEach((compra: Compra) => {
              if (compra.compra_credito?.id) {
                // Inicializar el array de cuotas si no existe
                if (!compra.compra_credito.cuotas) {
                  compra.compra_credito.cuotas = [];
                }
                // Siempre cargar las cuotas desde el backend para asegurar que estén actualizadas
                this.loadCuotasForCompra(compra);
              }
            });
            
            this.currentPage = response.data.current_page;
            this.lastPage = response.data.last_page;
            this.total = response.data.total; // Usar el total de la paginación, no el filtrado
            this.perPage = response.data.per_page;
          }
        },
        error: (error) => {
          console.error('Error al cargar compras a crédito:', error);
        }
      });
  }

  loadCuotasForCompra(compra: Compra): void {
    if (compra.compra_credito?.id) {
      const compraCreditoId = compra.compra_credito.id;
      this.compraCuotaService.getByCompraCredito(compraCreditoId)
        .subscribe({
          next: (response) => {
            if (response.success && response.data) {
              // Asegurar que compra.compra_credito existe
              if (!compra.compra_credito) {
                return;
              }
              // Asignar las cuotas
              compra.compra_credito.cuotas = Array.isArray(response.data) ? response.data : [];
            } else {
              // Inicializar array vacío si no hay respuesta
              if (compra.compra_credito) {
                compra.compra_credito.cuotas = [];
              }
            }
          },
          error: (error) => {
            // Inicializar array vacío en caso de error
            if (compra.compra_credito) {
              compra.compra_credito.cuotas = [];
            }
          }
        });
    }
  }

  onSearch(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.currentPage = 1;
    this.loadComprasCredito();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadComprasCredito();
  }

  onView(compra: Compra): void {
    // Cargar la compra completa con todos sus detalles desde el backend
    this.compraService.getById(compra.id)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.compraSeleccionada = response.data;
          } else if (response.data) {
            this.compraSeleccionada = response.data as Compra;
          } else {
            // Fallback: usar la compra que ya tenemos
            this.compraSeleccionada = compra;
          }
          this.isDetailModalOpen = true;
          this.loadCuotas(this.compraSeleccionada);
        },
        error: (error) => {
          console.error('Error al cargar detalle de compra:', error);
          // Fallback: usar la compra que ya tenemos
          this.compraSeleccionada = compra;
          this.isDetailModalOpen = true;
          this.loadCuotas(this.compraSeleccionada);
        }
      });
  }

  onPagar(compra: Compra): void {
    this.compraSeleccionada = compra;
    this.isPagoModalOpen = true;
    this.loadCuotas(compra);
  }

  loadCuotas(compra: Compra): void {
    if (compra.compra_credito?.id) {
      this.compraCuotaService.getByCompraCredito(compra.compra_credito.id)
        .subscribe({
          next: (response) => {
            if (response.success && response.data) {
              this.cuotas = response.data;
            }
          },
          error: (error) => {
            console.error('Error al cargar cuotas:', error);
            this.cuotas = [];
          }
        });
    } else {
      this.cuotas = [];
    }
  }

  closeDetailModal(): void {
    this.isDetailModalOpen = false;
    this.compraSeleccionada = null;
    this.cuotas = [];
  }

  closePagoModal(): void {
    this.isPagoModalOpen = false;
    this.compraSeleccionada = null;
    this.cuotas = [];
  }

  onPayCuota(event: { cuota: CompraCuota; monto: number }): void {
    this.isPaying = true;
    this.compraCuotaService.pagarCuota(
      event.cuota.id,
      event.monto
    )
      .pipe(finalize(() => this.isPaying = false))
      .subscribe({
        next: (response) => {
          if (response.success) {
            alert('Cuota pagada exitosamente');
            if (this.compraSeleccionada) {
              this.loadCuotas(this.compraSeleccionada);
            }
            this.loadComprasCredito();
            setTimeout(() => {
              const cuotasPendientes = this.cuotas.filter(c => c.estado !== 'Pagado');
              if (cuotasPendientes.length === 0) {
                this.closePagoModal();
              }
            }, 500);
          } else {
            alert(response.message || 'Error al pagar la cuota');
          }
        },
        error: (error) => {
          console.error('Error al pagar cuota:', error);
          const errorMessage = error?.error?.message || 'Error al pagar la cuota';
          alert(`Error: ${errorMessage}`);
        }
      });
  }

  getTotalDescuentoIndividual(): number {
    if (!this.compraSeleccionada?.detalles) return 0;
    return this.compraSeleccionada.detalles.reduce((sum, detalle) => {
      return sum + (parseFloat(String(detalle.descuento || 0)));
    }, 0);
  }

  getPorcentajeDescuentoGlobal(): number {
    if (!this.compraSeleccionada?.descuento_global) return 0;
    const total = parseFloat(String(this.compraSeleccionada.total || 0));
    const descuentoGlobal = parseFloat(String(this.compraSeleccionada.descuento_global || 0));
    const totalNeto = total + descuentoGlobal;
    if (totalNeto === 0) return 0;
    return (descuentoGlobal / totalNeto) * 100;
  }

  getTipoPago(): string {
    if (!this.compraSeleccionada?.compra_credito?.tipo_pago_cuota) return 'No especificado';
    return this.compraSeleccionada.compra_credito.tipo_pago_cuota;
  }
}

