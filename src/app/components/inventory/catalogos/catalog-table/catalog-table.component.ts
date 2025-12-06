import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CatalogItem {
  id: number;
  nombre: string;
  descripcion?: string;
  nombre_medida?: string;
}

@Component({
  selector: 'app-catalog-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalog-table.component.html',
})
export class CatalogTableComponent {
  @Input() title: string = '';
  @Input() items: CatalogItem[] = [];
  @Input() isLoading: boolean = false;
  @Input() currentPage: number = 1;
  @Input() lastPage: number = 1;
  @Input() totalItems: number = 0;
  @Input() showNameMedida: boolean = false; // For medidas

  @Output() create = new EventEmitter<void>();
  @Output() edit = new EventEmitter<CatalogItem>();
  @Output() delete = new EventEmitter<number>();
  @Output() pageChange = new EventEmitter<number>();

  onCreateClick(): void {
    this.create.emit();
  }

  onEditClick(item: CatalogItem): void {
    this.edit.emit(item);
  }

  onDeleteClick(id: number): void {
    this.delete.emit(id);
  }

  onPageChangeClick(page: number): void {
    this.pageChange.emit(page);
  }

  getDisplayName(item: CatalogItem): string {
    return this.showNameMedida ? (item.nombre_medida || item.nombre) : item.nombre;
  }
}
