import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Medida } from '../../../../interfaces';

@Component({
  selector: 'app-medidas-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './medidas-list.component.html',
})
export class MedidasListComponent {
  @Input() medidas: Medida[] = [];
  @Input() isLoading: boolean = false;

  @Output() edit = new EventEmitter<Medida>();
  @Output() delete = new EventEmitter<number>();

  onEdit(medida: Medida): void {
    this.edit.emit(medida);
  }

  onDelete(id: number): void {
    this.delete.emit(id);
  }
}

