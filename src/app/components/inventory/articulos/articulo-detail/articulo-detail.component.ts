import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { Articulo } from '../../../../interfaces';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-articulo-detail',
  standalone: true,
  imports: [CommonModule, NgClass],
  templateUrl: './articulo-detail.component.html',
})
export class ArticuloDetailComponent {
  @Input() articulo: Articulo | null = null;
  @Output() close = new EventEmitter<void>();

  get imageUrl(): string | null {
    if (this.articulo?.fotografia) {
      return `${environment.apiUrl.replace('/api', '')}/storage/${this.articulo.fotografia}`;
    }
    return null;
  }

  onClose(): void {
    this.close.emit();
  }
}
