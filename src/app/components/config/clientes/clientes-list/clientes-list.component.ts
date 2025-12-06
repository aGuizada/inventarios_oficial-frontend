import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cliente } from '../../../../interfaces';

@Component({
  selector: 'app-clientes-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clientes-list.component.html',
})
export class ClientesListComponent {
  @Input() clientes: Cliente[] = [];
  @Input() isLoading: boolean = false;

  @Output() edit = new EventEmitter<Cliente>();
  @Output() delete = new EventEmitter<number>();

  onEdit(cliente: Cliente): void {
    this.edit.emit(cliente);
  }

  onDelete(id: number): void {
    this.delete.emit(id);
  }
}

