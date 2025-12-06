import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Traspaso, Sucursal } from '../../../../interfaces';

@Component({
  selector: 'app-traspasos-list',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './traspasos-list.component.html',
})
export class TraspasosListComponent {
  @Input() traspasos: Traspaso[] = [];
  @Input() isLoading: boolean = false;
  @Input() sucursales: Sucursal[] = [];

  @Output() approve = new EventEmitter<Traspaso>();
  @Output() receive = new EventEmitter<Traspaso>();
  @Output() reject = new EventEmitter<Traspaso>();

  getEstadoColor(estado: string): string {
    const colores: { [key: string]: string } = {
      'PENDIENTE': 'bg-yellow-100 text-yellow-800',
      'APROBADO': 'bg-blue-100 text-blue-800',
      'EN_TRANSITO': 'bg-purple-100 text-purple-800',
      'RECIBIDO': 'bg-green-100 text-green-800',
      'RECHAZADO': 'bg-red-100 text-red-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
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

