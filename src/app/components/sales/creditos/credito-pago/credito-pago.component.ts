import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MonedaPipe } from '../../../../pipes/moneda.pipe';
import { FormsModule } from '@angular/forms';
import { CreditoVenta, CuotaCredito } from '../../../../interfaces';

@Component({
  selector: 'app-credito-pago',
  standalone: true,
  imports: [CommonModule, DatePipe, MonedaPipe, FormsModule],
  templateUrl: './credito-pago.component.html',
})
export class CreditoPagoComponent implements OnInit {
  @Input() credito: CreditoVenta | null = null;
  @Input() cuotas: CuotaCredito[] = [];
  @Input() isLoading: boolean = false;

  @Output() close = new EventEmitter<void>();
  @Output() payCuota = new EventEmitter<{ cuota: CuotaCredito; monto: number }>();
  @Output() generateCuotas = new EventEmitter<number>();

  cuotaAPagar: CuotaCredito | null = null;
  montoPago: number = 0;
  isPaying = false;

  ngOnInit(): void {
    if (this.cuotas.length === 0 && this.credito) {
      // Las cuotas se generan automáticamente, pero podemos mostrar un botón si no hay
    }
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

  onClose(): void {
    this.close.emit();
  }

  onOpenPay(cuota: CuotaCredito): void {
    this.cuotaAPagar = cuota;
    this.montoPago = cuota.precio_cuota || cuota.saldo_restante || 0;
  }

  onClosePay(): void {
    this.cuotaAPagar = null;
    this.montoPago = 0;
  }

  onPay(): void {
    if (!this.cuotaAPagar || this.montoPago <= 0) {
      return;
    }
    this.payCuota.emit({ cuota: this.cuotaAPagar, monto: this.montoPago });
  }

  onGenerateCuotas(): void {
    if (this.credito) {
      this.generateCuotas.emit(this.credito.id);
    }
  }
}

