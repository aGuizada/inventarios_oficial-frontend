import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sucursal } from '../../../../interfaces';

@Component({
  selector: 'app-sucursales-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sucursales-list.component.html',
})
export class SucursalesListComponent {
  @Input() sucursales: Sucursal[] = [];
  @Input() isLoading: boolean = false;

  @Output() edit = new EventEmitter<Sucursal>();
  @Output() delete = new EventEmitter<number>();

  onEdit(sucursal: Sucursal): void {
    this.edit.emit(sucursal);
  }

  onDelete(id: number): void {
    this.delete.emit(id);
  }
}

