import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { Caja } from '../../../../interfaces';

@Component({
  selector: 'app-cajas-list',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe],
  templateUrl: './cajas-list.component.html',
})
export class CajasListComponent {
  @Input() cajas: Caja[] = [];
  @Input() isLoading: boolean = false;

  @Output() close = new EventEmitter<Caja>();

  isCajaOpen(caja: Caja): boolean {
    return caja.estado === 'abierta' || caja.estado === '1' || caja.estado === 1 || caja.estado === true;
  }

  onClose(caja: Caja): void {
    this.close.emit(caja);
  }
}

