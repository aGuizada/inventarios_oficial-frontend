import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Rol } from '../../../../interfaces';

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './roles-list.component.html',
})
export class RolesListComponent {
  @Input() roles: Rol[] = [];
  @Input() isLoading: boolean = false;

  @Output() edit = new EventEmitter<Rol>();
  @Output() delete = new EventEmitter<number>();

  onEdit(rol: Rol): void {
    this.edit.emit(rol);
  }

  onDelete(id: number): void {
    this.delete.emit(id);
  }
}

