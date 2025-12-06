import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Empresa } from '../../../../interfaces';

@Component({
  selector: 'app-empresas-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empresas-list.component.html',
})
export class EmpresasListComponent {
  @Input() empresas: Empresa[] = [];
  @Input() isLoading: boolean = false;

  @Output() edit = new EventEmitter<Empresa>();
  @Output() delete = new EventEmitter<number>();

  onEdit(empresa: Empresa): void {
    this.edit.emit(empresa);
  }

  onDelete(id: number): void {
    this.delete.emit(id);
  }
}

