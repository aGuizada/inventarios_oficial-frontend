import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Industria } from '../../../../interfaces';

@Component({
  selector: 'app-industrias-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './industrias-list.component.html',
})
export class IndustriasListComponent {
  @Input() industrias: Industria[] = [];
  @Input() isLoading: boolean = false;

  @Output() edit = new EventEmitter<Industria>();
  @Output() delete = new EventEmitter<number>();

  onEdit(industria: Industria): void {
    this.edit.emit(industria);
  }

  onDelete(id: number): void {
    this.delete.emit(id);
  }
}

