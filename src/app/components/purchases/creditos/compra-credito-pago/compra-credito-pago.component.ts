import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Compra, CompraCuota } from '../../../../interfaces';

@Component({
  selector: 'app-compra-credito-pago',
  standalone: true,
  imports: [CommonModule, DatePipe, NgClass, FormsModule],
  templateUrl: './compra-credito-pago.component.html',
})
export class CompraCreditoPagoComponent implements OnInit {
  @Input() compra: Compra | null = null;
  @Input() cuotas: CompraCuota[] = [];
  @Input() isLoading: boolean = false;

  @Output() close = new EventEmitter<void>();
  @Output() payCuota = new EventEmitter<{ cuota: CompraCuota; monto: number }>();

  cuotaAPagar: CompraCuota | null = null;
  montoPago: number = 0;
  isPaying = false;

  ngOnInit(): void {
    if (this.cuotas.length === 0 && this.compra) {
      // Las cuotas se generan automáticamente
    }
  }

  getCuotasPendientes(compra: Compra): number {
    if (!compra.compra_credito?.cuotas || compra.compra_credito.cuotas.length === 0) {
      return compra.compra_credito?.num_cuotas || 0;
    }
    return compra.compra_credito.cuotas.filter((c: CompraCuota) => c.estado !== 'Pagado').length;
  }

  getCuotasPagadas(compra: Compra): number {
    if (!compra.compra_credito?.cuotas || compra.compra_credito.cuotas.length === 0) {
      return 0;
    }
    return compra.compra_credito.cuotas.filter((c: CompraCuota) => c.estado === 'Pagado').length;
  }

  onClose(): void {
    this.close.emit();
  }

  onOpenPay(cuota: CompraCuota): void {
    this.cuotaAPagar = cuota;
    this.montoPago = cuota.saldo_pendiente || cuota.monto_cuota || 0;
  }

  onClosePay(): void {
    this.cuotaAPagar = null;
    this.montoPago = 0;
  }

  onPay(): void {
    if (!this.cuotaAPagar || this.montoPago <= 0) {
      return;
    }
    this.isPaying = true;
    this.payCuota.emit({ cuota: this.cuotaAPagar, monto: this.montoPago });
  }
}

