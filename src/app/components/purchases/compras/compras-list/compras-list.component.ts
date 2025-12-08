import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe, NgClass } from '@angular/common';
import { Compra } from '../../../../interfaces';

@Component({
  selector: 'app-compras-list',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe],
  templateUrl: './compras-list.component.html',
})
export class ComprasListComponent {
  @Input() compras: Compra[] = [];
  @Input() isLoading: boolean = false;

  @Output() view = new EventEmitter<Compra>();
  @Output() edit = new EventEmitter<Compra>();
  @Output() delete = new EventEmitter<number>();

  onView(compra: Compra): void {
    this.view.emit(compra);
  }

  onEdit(compra: Compra): void {
    this.edit.emit(compra);
  }

  onDelete(id: number): void {
    this.delete.emit(id);
  }
}

