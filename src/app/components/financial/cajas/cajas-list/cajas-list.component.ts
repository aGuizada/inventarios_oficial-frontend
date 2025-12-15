import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { MonedaPipe } from '../../../../pipes/moneda.pipe';
import { Caja } from '../../../../interfaces';

@Component({
  selector: 'app-cajas-list',
  standalone: true,
  imports: [CommonModule, DatePipe, MonedaPipe, NgClass],
  templateUrl: './cajas-list.component.html',
})
export class CajasListComponent {
  @Input() cajas: Caja[] = [];
  @Input() isLoading: boolean = false;

  @Output() close = new EventEmitter<Caja>();
  @Output() view = new EventEmitter<Caja>();
  @Output() addMoney = new EventEmitter<Caja>();
  @Output() withdrawMoney = new EventEmitter<Caja>();

  isCajaOpen(caja: Caja): boolean {
    return caja.estado === 'abierta' || caja.estado === '1' || caja.estado === 1 || caja.estado === true;
  }

  onClose(caja: Caja): void {
    this.close.emit(caja);
  }

  onView(caja: Caja): void {
    this.view.emit(caja);
  }

  onAddMoney(caja: Caja): void {
    this.addMoney.emit(caja);
  }

  onWithdrawMoney(caja: Caja): void {
    this.withdrawMoney.emit(caja);
  }

  getDepositos(caja: Caja): number {
    const valor = Number(caja.depositos);
    return isNaN(valor) ? 0 : valor;
  }

  getSalidas(caja: Caja): number {
    const valor = Number(caja.salidas);
    return isNaN(valor) ? 0 : valor;
  }

  getComprasContado(caja: Caja): number {
    const valor = Number(caja.compras_contado);
    return isNaN(valor) ? 0 : valor;
  }

  getComprasCredito(caja: Caja): number {
    const valor = Number(caja.compras_credito);
    return isNaN(valor) ? 0 : valor;
  }

  getSaldoTotal(caja: Caja): number {
    // Usar el valor calculado del backend (saldo_caja)
    // Si no existe, calcular como fallback (aunque debería venir del backend)
    if (caja.saldo_caja !== undefined && caja.saldo_caja !== null) {
      const valor = Number(caja.saldo_caja);
      if (!isNaN(valor)) {
        return valor;
      }
    }
    
    // Fallback: calcular si no viene del backend (no debería pasar)
    const saldoInicial = Number(caja.saldo_inicial) || 0;
    const ventasTotales = Number(caja.ventas) || 0;
    const entradas = this.getDepositos(caja);
    const comprasTotales = this.getComprasContado(caja) + this.getComprasCredito(caja);
    const salidas = this.getSalidas(caja);
    
    return saldoInicial + ventasTotales + entradas - comprasTotales - salidas;
  }
}

