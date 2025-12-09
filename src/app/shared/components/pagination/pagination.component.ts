import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
})
export class PaginationComponent {
  @Input() currentPage: number = 1;
  @Input() lastPage: number = 1;
  @Input() total: number = 0;
  @Input() perPage: number = 15;
  @Input() showInfo: boolean = true;
  
  @Output() pageChange = new EventEmitter<number>();

  get from(): number {
    return this.total === 0 ? 0 : ((this.currentPage - 1) * this.perPage) + 1;
  }

  get to(): number {
    return Math.min(this.currentPage * this.perPage, this.total);
  }

  get pages(): number[] {
    const pages: number[] = [];
    const maxPages = 7; // Mostrar máximo 7 páginas
    let start = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let end = Math.min(this.lastPage, start + maxPages - 1);
    
    // Ajustar inicio si estamos cerca del final
    if (end - start < maxPages - 1) {
      start = Math.max(1, end - maxPages + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.lastPage && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  goToFirst(): void {
    if (this.currentPage > 1) {
      this.goToPage(1);
    }
  }

  goToLast(): void {
    if (this.currentPage < this.lastPage) {
      this.goToPage(this.lastPage);
    }
  }

  goToPrevious(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  goToNext(): void {
    if (this.currentPage < this.lastPage) {
      this.goToPage(this.currentPage + 1);
    }
  }
}

