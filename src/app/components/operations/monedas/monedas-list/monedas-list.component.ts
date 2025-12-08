import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DecimalPipe, NgClass } from '@angular/common';
import { Moneda } from '../../../../interfaces';

@Component({
  selector: 'app-monedas-list',
  standalone: true,
  imports: [CommonModule, DecimalPipe, NgClass],
  templateUrl: './monedas-list.component.html',
})
export class MonedasListComponent {
  @Input() monedas: Moneda[] = [];
  @Input() isLoading: boolean = false;
  @Input() empresas: any[] = [];

  @Output() edit = new EventEmitter<Moneda>();
  @Output() delete = new EventEmitter<Moneda>();
  @Output() updateTipoCambio = new EventEmitter<Moneda>();

  getEmpresaNombre(moneda: Moneda): string {
    if (moneda.empresa && moneda.empresa.nombre) {
      return moneda.empresa.nombre;
    }
    if (moneda.empresa_id && this.empresas.length > 0) {
      const empresa = this.empresas.find(e => e.id === moneda.empresa_id);
      if (empresa) {
        return empresa.nombre;
      }
    }
    return 'N/A';
  }

  onEdit(moneda: Moneda): void {
    this.edit.emit(moneda);
  }

  onDelete(moneda: Moneda): void {
    this.delete.emit(moneda);
  }

  onUpdateTipoCambio(moneda: Moneda): void {
    this.updateTipoCambio.emit(moneda);
  }
}
