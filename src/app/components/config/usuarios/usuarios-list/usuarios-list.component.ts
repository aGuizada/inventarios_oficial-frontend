import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../../interfaces';

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuarios-list.component.html',
})
export class UsuariosListComponent {
  @Input() usuarios: User[] = [];
  @Input() isLoading: boolean = false;

  @Output() edit = new EventEmitter<User>();
  @Output() delete = new EventEmitter<number>();

  onEdit(user: User): void {
    this.edit.emit(user);
  }

  onDelete(id: number): void {
    this.delete.emit(id);
  }
}

