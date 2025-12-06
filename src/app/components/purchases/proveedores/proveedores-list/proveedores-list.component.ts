import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Proveedor } from '../../../../interfaces';

@Component({
  selector: 'app-proveedores-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './proveedores-list.component.html',
})
export class ProveedoresListComponent {
  @Input() proveedores: Proveedor[] = [];
  @Input() isLoading: boolean = false;

  @Output() edit = new EventEmitter<Proveedor>();
  @Output() delete = new EventEmitter<number>();

  onEdit(proveedor: Proveedor): void {
    this.edit.emit(proveedor);
  }

  onDelete(id: number): void {
    this.delete.emit(id);
  }
}

