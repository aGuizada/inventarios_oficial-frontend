import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe, NgClass } from '@angular/common';
import { Venta } from '../../../../interfaces';

@Component({
  selector: 'app-ventas-list',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe, NgClass],
  templateUrl: './ventas-list.component.html',
})
export class VentasListComponent {
  @Input() ventas: Venta[] = [];
  @Input() isLoading: boolean = false;

  @Output() view = new EventEmitter<Venta>();
  @Output() edit = new EventEmitter<Venta>();
  @Output() delete = new EventEmitter<number>();
  @Output() print = new EventEmitter<Venta>();

  onView(venta: Venta): void {
    this.view.emit(venta);
  }

  onEdit(venta: Venta): void {
    this.edit.emit(venta);
  }

  onDelete(id: number): void {
    this.delete.emit(id);
  }

  onPrint(venta: Venta): void {
    this.print.emit(venta);
  }
}

