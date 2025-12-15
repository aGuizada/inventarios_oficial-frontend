import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Almacen, Sucursal } from '../../../../interfaces';

@Component({
  selector: 'app-inventario-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario-filters.component.html',
})
export class InventarioFiltersComponent {
  @Input() almacenes: Almacen[] = [];
  @Input() sucursales: Sucursal[] = [];
  @Input() almacenSeleccionado: number | null = null;
  @Input() sucursalSeleccionada: number | null = null;
  @Input() busqueda: string = '';
  @Input() isAdmin: boolean = false;

  @Output() almacenChange = new EventEmitter<number | null>();
  @Output() sucursalChange = new EventEmitter<number | null>();
  @Output() busquedaChange = new EventEmitter<string>();
  @Output() clearFilters = new EventEmitter<void>();

  showFilters: boolean = false;

  onAlmacenChange(event: any): void {
    const value = event.target.value;
    const almacenId = value === '' || value === 'null' ? null : Number(value);
    this.almacenChange.emit(almacenId);
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  onSucursalChange(event: any): void {
    const value = event.target.value;
    const sucursalId = value === '' || value === 'null' ? null : Number(value);
    this.sucursalChange.emit(sucursalId);
  }

  onBusquedaChange(event: any): void {
    this.busquedaChange.emit(event.target.value);
  }

  onClearFilters(): void {
    this.clearFilters.emit();
  }
}

