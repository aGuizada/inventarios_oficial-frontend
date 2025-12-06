import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Categoria } from '../../../../interfaces';

@Component({
  selector: 'app-categorias-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categorias-list.component.html',
})
export class CategoriasListComponent {
  @Input() categorias: Categoria[] = [];
  @Input() isLoading: boolean = false;

  @Output() edit = new EventEmitter<Categoria>();
  @Output() delete = new EventEmitter<number>();

  onEdit(categoria: Categoria): void {
    this.edit.emit(categoria);
  }

  onDelete(id: number): void {
    this.delete.emit(id);
  }
}

