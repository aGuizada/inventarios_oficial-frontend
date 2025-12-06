import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Inventario, Almacen } from '../../../../interfaces';

@Component({
  selector: 'app-inventario-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inventario-list.component.html',
})
export class InventarioListComponent {
  @Input() inventarios: Inventario[] = [];
  @Input() isLoading: boolean = false;
  @Input() almacenes: Almacen[] = [];

  getNombreAlmacen(almacenId: number): string {
    const almacen = this.almacenes.find(a => a.id === almacenId);
    return almacen?.nombre_almacen || 'N/A';
  }

  getTotalCantidad(): number {
    return this.inventarios.reduce((sum, inv) => sum + inv.cantidad, 0);
  }

  getTotalSaldoStock(): number {
    return this.inventarios.reduce((sum, inv) => sum + inv.saldo_stock, 0);
  }
}

