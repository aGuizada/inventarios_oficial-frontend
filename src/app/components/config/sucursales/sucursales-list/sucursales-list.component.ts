import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { Sucursal } from '../../../../interfaces';

@Component({
  selector: 'app-sucursales-list',
  standalone: true,
  imports: [CommonModule, NgClass],
  templateUrl: './sucursales-list.component.html',
})
export class SucursalesListComponent {
  @Input() sucursales: Sucursal[] = [];
  @Input() isLoading: boolean = false;

  @Output() edit = new EventEmitter<Sucursal>();
  @Output() delete = new EventEmitter<number>();

  onEdit(sucursal: Sucursal): void {
    console.log('onEdit llamado con sucursal:', sucursal);
    if (!sucursal || !sucursal.id) {
      console.error('Sucursal inválida o sin ID:', sucursal);
      return;
    }
    this.edit.emit(sucursal);
  }

  onDelete(id: number): void {
    console.log('onDelete llamado con id:', id);
    if (!id) {
      console.error('ID inválido:', id);
      return;
    }
    this.delete.emit(id);
  }
}

