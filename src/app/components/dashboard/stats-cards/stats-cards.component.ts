import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-stats-cards',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './stats-cards.component.html',
})
export class StatsCardsComponent {
  @Input() ventasDelDia: number = 0;
  @Input() totalVentas: number = 0;
  @Input() productosBajos: number = 0;
  @Input() clientesActivos: number = 0;
}

