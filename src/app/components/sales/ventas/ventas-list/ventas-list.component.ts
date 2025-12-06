import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { Venta } from '../../../../interfaces';

@Component({
  selector: 'app-ventas-list',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe],
  templateUrl: './ventas-list.component.html',
})
export class VentasListComponent {
  @Input() ventas: Venta[] = [];
  @Input() isLoading: boolean = false;

  @Output() view = new EventEmitter<Venta>();
  @Output() edit = new EventEmitter<Venta>();
  @Output() delete = new EventEmitter<number>();

  onView(venta: Venta): void {
    this.view.emit(venta);
  }

  onEdit(venta: Venta): void {
    this.edit.emit(venta);
  }

  onDelete(id: number): void {
    this.delete.emit(id);
  }
}

