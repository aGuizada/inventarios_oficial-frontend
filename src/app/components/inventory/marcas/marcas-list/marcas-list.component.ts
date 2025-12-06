import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Marca } from '../../../../interfaces';

@Component({
  selector: 'app-marcas-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './marcas-list.component.html',
})
export class MarcasListComponent {
  @Input() marcas: Marca[] = [];
  @Input() isLoading: boolean = false;

  @Output() edit = new EventEmitter<Marca>();
  @Output() delete = new EventEmitter<number>();

  onEdit(marca: Marca): void {
    this.edit.emit(marca);
  }

  onDelete(id: number): void {
    this.delete.emit(id);
  }
}

