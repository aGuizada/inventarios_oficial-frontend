import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Inventario, Articulo } from '../../../interfaces';

@Component({
  selector: 'app-low-stock',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './low-stock.component.html',
})
export class LowStockComponent {
  @Input() productos: Inventario[] = [];
  @Input() isLoading: boolean = false;

  @Output() viewInventory = new EventEmitter<void>();

  getNombreArticulo(articuloId: number, articulo?: Articulo): string {
    if (articulo?.nombre) return articulo.nombre;
    return `Artículo #${articuloId}`;
  }

  onViewInventory(): void {
    this.viewInventory.emit();
  }
}

