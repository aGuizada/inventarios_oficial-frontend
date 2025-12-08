import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { Traspaso, Sucursal } from '../../../../interfaces';

@Component({
  selector: 'app-traspasos-list',
  standalone: true,
  imports: [CommonModule, DatePipe, NgClass],
  templateUrl: './traspasos-list.component.html',
})
export class TraspasosListComponent {
  @Input() traspasos: Traspaso[] = [];
  @Input() isLoading: boolean = false;
  @Input() sucursales: Sucursal[] = [];

  @Output() approve = new EventEmitter<Traspaso>();
  @Output() receive = new EventEmitter<Traspaso>();
  @Output() reject = new EventEmitter<Traspaso>();

  getEstadoColor(estado: string): { [key: string]: boolean } {
    return {
      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300': estado === 'PENDIENTE',
      'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300': estado === 'APROBADO',
      'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300': estado === 'EN_TRANSITO',
      'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300': estado === 'RECIBIDO',
      'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300': estado === 'RECHAZADO',
      'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300': !['PENDIENTE', 'APROBADO', 'EN_TRANSITO', 'RECIBIDO', 'RECHAZADO'].includes(estado)
    };
  }

  getSucursalNombre(traspaso: Traspaso, tipo: 'origen' | 'destino'): string {
    if (tipo === 'origen' && traspaso.sucursal_origen) {
      return traspaso.sucursal_origen.nombre;
    }
    if (tipo === 'destino' && traspaso.sucursal_destino) {
      return traspaso.sucursal_destino.nombre;
    }
    
    const sucursalId = tipo === 'origen' ? traspaso.sucursal_origen_id : traspaso.sucursal_destino_id;
    const sucursal = this.sucursales.find(s => s.id === sucursalId);
    return sucursal?.nombre || 'N/A';
  }

  onApprove(traspaso: Traspaso): void {
    this.approve.emit(traspaso);
  }

  onReceive(traspaso: Traspaso): void {
    this.receive.emit(traspaso);
  }

  onReject(traspaso: Traspaso): void {
    this.reject.emit(traspaso);
  }
}

