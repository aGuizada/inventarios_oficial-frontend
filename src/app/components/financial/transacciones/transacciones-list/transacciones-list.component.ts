import { Component, Input } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { TransaccionCaja } from '../../../../interfaces';

@Component({
  selector: 'app-transacciones-list',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe],
  templateUrl: './transacciones-list.component.html',
})
export class TransaccionesListComponent {
  @Input() transacciones: TransaccionCaja[] = [];
  @Input() isLoading: boolean = false;
}

