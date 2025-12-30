import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { MonedaPipe } from '../../../../pipes/moneda.pipe';
import { Articulo } from '../../../../interfaces';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-articulos-list',
  standalone: true,
  imports: [CommonModule, NgClass, MonedaPipe],
  templateUrl: './articulos-list.component.html',
})
export class ArticulosListComponent {
  private _articulos: Articulo[] = [];

  @Input()
  set articulos(value: Articulo[] | null | undefined) {
    // Asegurar que siempre sea un array válido
    if (Array.isArray(value)) {
      this._articulos = value;
    } else if (value === null || value === undefined) {
      this._articulos = [];
    } else {
      // Si es un objeto, intentar convertirlo a array
      console.warn('ArticulosListComponent: recibió un valor no-array:', value);
      this._articulos = [];
    }
  }
  get articulos(): Articulo[] {
    return this._articulos || [];
  }

  @Input() isLoading: boolean = false;
  @Input() currentPage: number = 1;
  @Input() lastPage: number = 1;
  @Input() totalItems: number = 0;

  @Output() view = new EventEmitter<Articulo>();
  @Output() edit = new EventEmitter<Articulo>();
  @Output() delete = new EventEmitter<number>();
  @Output() pageChange = new EventEmitter<number>();

  getImageUrl(articulo: Articulo): string {
    if (articulo.fotografia) {
      const baseUrl = environment.apiUrl.replace('/api', '');
      return `${baseUrl}/storage/${articulo.fotografia}`;
    }
    return '/assets/images/no-image.jpg';
  }

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
