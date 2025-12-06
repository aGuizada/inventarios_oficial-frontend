import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Almacen } from '../../../../interfaces';

@Component({
  selector: 'app-inventario-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario-filters.component.html',
})
export class InventarioFiltersComponent {
  @Input() almacenes: Almacen[] = [];
  @Input() almacenSeleccionado: number | null = null;
  @Input() busqueda: string = '';

  @Output() almacenChange = new EventEmitter<number | null>();
  @Output() busquedaChange = new EventEmitter<string>();
  @Output() clearFilters = new EventEmitter<void>();

  onAlmacenChange(event: any): void {
    const value = event.target.value;
    const almacenId = value === '' || value === 'null' ? null : Number(value);
    this.almacenChange.emit(almacenId);
  }

  onBusquedaChange(event: any): void {
    this.busquedaChange.emit(event.target.value);
  }

  onClearFilters(): void {
    this.clearFilters.emit();
  }
}

