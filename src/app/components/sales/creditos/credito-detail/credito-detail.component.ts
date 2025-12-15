import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MonedaPipe } from '../../../../pipes/moneda.pipe';
import { CreditoVenta } from '../../../../interfaces';

@Component({
  selector: 'app-credito-detail',
  standalone: true,
  imports: [CommonModule, DatePipe, MonedaPipe],
  templateUrl: './credito-detail.component.html',
})
export class CreditoDetailComponent {
  @Input() credito: CreditoVenta | null = null;

  @Output() close = new EventEmitter<void>();

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
}

