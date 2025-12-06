import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Articulo } from '../../../../interfaces';

@Component({
  selector: 'app-articulos-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './articulos-list.component.html',
})
export class ArticulosListComponent {
  @Input() articulos: Articulo[] = [];
  @Input() isLoading: boolean = false;
  @Input() currentPage: number = 1;
  @Input() lastPage: number = 1;
  @Input() totalItems: number = 0;

  @Output() view = new EventEmitter<Articulo>();
  @Output() edit = new EventEmitter<Articulo>();
  @Output() delete = new EventEmitter<number>();
  @Output() pageChange = new EventEmitter<number>();

  onView(articulo: Articulo): void {
    this.view.emit(articulo);
  }

  onEdit(articulo: Articulo): void {
    this.edit.emit(articulo);
  }

  onDelete(id: number): void {
    this.delete.emit(id);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.lastPage) {
      this.pageChange.emit(page);
    }
  }
}
