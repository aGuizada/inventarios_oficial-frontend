import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { Cotizacion } from '../../../../interfaces';

@Component({
  selector: 'app-cotizaciones-list',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe],
  templateUrl: './cotizaciones-list.component.html',
})
export class CotizacionesListComponent {
  @Input() cotizaciones: Cotizacion[] = [];
  @Input() isLoading: boolean = false;

  @Output() edit = new EventEmitter<Cotizacion>();
  @Output() delete = new EventEmitter<number>();

  onEdit(cotizacion: Cotizacion): void {
    this.edit.emit(cotizacion);
  }

  onDelete(id: number): void {
    this.delete.emit(id);
  }
}

