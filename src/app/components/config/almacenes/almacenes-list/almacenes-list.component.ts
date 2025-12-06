import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Almacen } from '../../../../interfaces';

@Component({
  selector: 'app-almacenes-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './almacenes-list.component.html',
})
export class AlmacenesListComponent {
  @Input() almacenes: Almacen[] = [];
  @Input() isLoading: boolean = false;

  @Output() edit = new EventEmitter<Almacen>();
  @Output() delete = new EventEmitter<number>();

  onEdit(almacen: Almacen): void {
    this.edit.emit(almacen);
  }

  onDelete(id: number): void {
    this.delete.emit(id);
  }
}

