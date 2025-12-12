import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { Caja } from '../../../../interfaces';
import { CajaService } from '../../../../services/caja.service';

@Component({
  selector: 'app-caja-detail',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, NgClass],
  templateUrl: './caja-detail.component.html',
})
export class CajaDetailComponent implements OnInit {
  @Input() caja: Caja | null = null;
  @Output() close = new EventEmitter<void>();

  isLoading = false;
  ventas: any[] = [];
  compras: any[] = [];
  transacciones: any[] = [];

  constructor(
    private cajaService: CajaService
  ) { }

  ngOnInit(): void {
    if (this.caja) {
      this.loadCajaDetails();
    }
  }

  loadCajaDetails(): void {
    if (!this.caja) return;

    this.isLoading = true;

    // Usar el nuevo endpoint que calcula todo en el backend
    this.cajaService.getCajaDetails(this.caja.id).subscribe({
      next: (response) => {
        // Actualizar los datos de la caja con los calculados
        if (response.caja) {
          this.caja = response.caja;
        }

        // Guardar ventas, compras y transacciones
        this.ventas = response.ventas || [];
        this.compras = response.compras || [];
        this.transacciones = response.transacciones || [];

        // Actualizar la caja con los valores calculados
        if (response.calculado && this.caja) {
          this.caja.ventas_contado = response.calculado.ventas_contado;
          this.caja.ventas_credito = response.calculado.ventas_credito;
          this.caja.pagos_qr = response.calculado.ventas_qr;
          this.caja.compras_contado = response.calculado.compras_contado;
          this.caja.compras_credito = response.calculado.compras_credito;
          this.caja.depositos = response.calculado.entradas;
          this.caja.salidas = response.calculado.salidas;
          this.caja.ventas = response.calculado.total_ventas;
          this.caja.saldo_caja = response.calculado.saldo_final;
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading caja details', error);
        this.isLoading = false;
      }
    });
  }

  calculateTotals(): void {
    // No longer needed, backend calculates everything
    this.isLoading = false;
  }

  getVentasContado(): number {
    return Number(this.caja?.ventas_contado) || 0;
  }

  getVentasCredito(): number {
    return Number(this.caja?.ventas_credito) || 0;
  }

  getVentasQR(): number {
    return Number(this.caja?.pagos_qr) || 0;
  }

  getComprasContado(): number {
    return Number(this.caja?.compras_contado) || 0;
  }

  getComprasCredito(): number {
    return Number(this.caja?.compras_credito) || 0;
  }

  getEntradas(): number {
    return Number(this.caja?.depositos) || 0;
  }

  getSalidas(): number {
    return Number(this.caja?.salidas) || 0;
  }

  getTotalVentas(): number {
    return Number(this.caja?.ventas) || 0;
  }

  getTotalCompras(): number {
    // Calcular desde compras si no está en caja
    return this.compras.reduce((sum: number, c: any) => sum + (Number(c.total) || 0), 0);
  }

  getSaldoFinal(): number {
    return Number(this.caja?.saldo_caja) || 0;
  }

  onClose(): void {
    this.close.emit();
  }
}

