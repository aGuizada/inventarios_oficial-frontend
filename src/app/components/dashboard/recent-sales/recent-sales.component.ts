import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { Venta, Cliente, Articulo } from '../../../interfaces';

@Component({
  selector: 'app-recent-sales',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe],
  templateUrl: './recent-sales.component.html',
})
export class RecentSalesComponent {
  @Input() ventas: Venta[] = [];
  @Input() isLoading: boolean = false;

  @Output() viewAll = new EventEmitter<void>();

  getNombreCliente(clienteId: number, cliente?: Cliente): string {
    if (cliente?.nombre) return cliente.nombre;
    return `Cliente #${clienteId}`;
  }

  getNombreTipoVenta(venta: any): string {
    const tipoVenta = venta.tipo_venta || venta.tipoVenta;
    if (!tipoVenta) return 'N/A';
    return tipoVenta.nombre_tipo_ventas || tipoVenta.nombre || 'N/A';
  }

  onViewAll(): void {
    this.viewAll.emit();
  }
}

