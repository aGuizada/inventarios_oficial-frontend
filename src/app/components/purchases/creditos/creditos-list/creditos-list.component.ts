import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe, NgClass } from '@angular/common';
import { Compra } from '../../../../interfaces/compra.interface';

@Component({
  selector: 'app-creditos-list',
  standalone: true,
  imports: [CommonModule, DatePipe, NgClass],
  templateUrl: './creditos-list.component.html',
})
export class CreditosListComponent {
  @Input() compras: Compra[] = [];
  @Input() isLoading: boolean = false;
  @Output() view = new EventEmitter<Compra>();
  @Output() pagar = new EventEmitter<Compra>();

  isContado(tipoCompra: string | undefined | null): boolean {
    if (!tipoCompra) return false;
    return tipoCompra.toLowerCase() === 'contado';
  }

  onView(compra: Compra): void {
    this.view.emit(compra);
  }

  onPagar(compra: Compra): void {
    this.pagar.emit(compra);
  }

  getEstadoCredito(compra: Compra): string {
    if (compra.compra_credito) {
      return compra.compra_credito.estado_credito || 'Pendiente';
    }
    return 'Pendiente';
  }

  getNumCuotas(compra: Compra): number {
    if (compra.compra_credito) {
      return compra.compra_credito.num_cuotas || 0;
    }
    return 0;
  }

  getCuotaInicial(compra: Compra): number {
    if (compra.compra_credito) {
      return compra.compra_credito.cuota_inicial || 0;
    }
    return 0;
  }

  getSaldoPendiente(compra: Compra): number {
    const total = compra.total || 0;
    const cuotaInicial = this.getCuotaInicial(compra);
    return Math.max(0, total - cuotaInicial);
  }

  getCuotasPendientes(compra: Compra): number {
    // Siempre usar las cuotas reales si están disponibles
    if (compra.compra_credito?.cuotas && Array.isArray(compra.compra_credito.cuotas)) {
      const pendientes = compra.compra_credito.cuotas.filter((c: any) => {
        const estado = c.estado?.toLowerCase() || '';
        return estado !== 'pagado';
      });
      return pendientes.length;
    }
    // Si no hay cuotas cargadas, usar num_cuotas como fallback
    // pero esto debería ser temporal hasta que se carguen las cuotas
    return compra.compra_credito?.num_cuotas || 0;
  }

  getCuotasPagadas(compra: Compra): number {
    if (compra.compra_credito?.cuotas && compra.compra_credito.cuotas.length > 0) {
      return compra.compra_credito.cuotas.filter((c: any) => c.estado === 'Pagado').length;
    }
    return 0;
  }

  getProximoPago(compra: Compra): string | null {
    if (compra.compra_credito?.cuotas && compra.compra_credito.cuotas.length > 0) {
      const cuotasPendientes = compra.compra_credito.cuotas
        .filter((c: any) => c.estado !== 'Pagado')
        .sort((a: any, b: any) => new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime());
      
      if (cuotasPendientes.length > 0) {
        return cuotasPendientes[0].fecha_vencimiento;
      }
    }
    return null;
  }

  getFrecuenciaDias(compra: Compra): number {
    return compra.compra_credito?.frecuencia_dias || 30;
  }
}

