import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe, NgClass } from '@angular/common';
import { Caja } from '../../../../interfaces';

@Component({
  selector: 'app-cajas-list',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe, NgClass],
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
    // Si existe saldo_caja y no es null, usarlo
    if (caja.saldo_caja !== undefined && caja.saldo_caja !== null) {
      const valor = Number(caja.saldo_caja);
      if (!isNaN(valor)) {
        return valor;
      }
    }
    
    // Calcular: Saldo Inicial + Ventas Totales + Entradas - Compras Totales - Salidas
    const saldoInicial = Number(caja.saldo_inicial) || 0;
    
    // Calcular ventas totales
    let ventasTotales = 0;
    if (caja.ventas !== undefined && caja.ventas !== null) {
      const ventas = Number(caja.ventas);
      ventasTotales = isNaN(ventas) ? 0 : ventas;
    } else {
      ventasTotales = (Number(caja.ventas_contado) || 0) + (Number(caja.ventas_credito) || 0) + (Number(caja.pagos_qr) || 0);
    }
    
    const entradas = this.getDepositos(caja);
    const comprasTotales = this.getComprasContado(caja) + this.getComprasCredito(caja);
    const salidas = this.getSalidas(caja);
    
    const total = saldoInicial + ventasTotales + entradas - comprasTotales - salidas;
    return total;
  }
}

