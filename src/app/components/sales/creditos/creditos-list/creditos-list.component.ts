import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { MonedaPipe } from '../../../../pipes/moneda.pipe';
import { CreditoVenta } from '../../../../interfaces';

@Component({
  selector: 'app-creditos-list',
  standalone: true,
  imports: [CommonModule, DatePipe, MonedaPipe, NgClass],
  templateUrl: './creditos-list.component.html',
})
export class CreditosListComponent {
  @Input() creditos: CreditoVenta[] = [];
  @Input() isLoading: boolean = false;

  @Output() viewDetail = new EventEmitter<CreditoVenta>();
  @Output() pay = new EventEmitter<CreditoVenta>();

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

  onViewDetail(credito: CreditoVenta): void {
    this.viewDetail.emit(credito);
  }

  onPay(credito: CreditoVenta): void {
    this.pay.emit(credito);
  }
}

